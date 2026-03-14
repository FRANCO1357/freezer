<?php

use App\Models\Freezer;
use App\Models\FreezerLog;
use App\Models\Invitation;
use App\Models\Product;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;

// Rate limit: 5 tentativi login/registrazione per minuto
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/login', function (Request $request) {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenziali non valide.'],
            ]);
        }

        if (! $user->email_verified_at) {
            throw ValidationException::withMessages([
                'email' => ['Account non verificato. Controlla la tua email e clicca sul link di conferma.'],
            ]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('login')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    });

    Route::post('/register', function (Request $request) {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            // il cast "hashed" nel modello penserà a criptare la password
            'password' => $data['password'],
        ]);

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->email),
            ]
        );

        Mail::raw(
            "Ciao {$user->name},\n\nclicca sul link seguente per confermare il tuo account Freezer Organizer:\n\n{$verificationUrl}\n\nSe non hai richiesto tu questo account, ignora questa email.",
            function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Conferma il tuo account Freezer Organizer');
            }
        );

        return response()->json([
            'message' => 'Registrazione completata. Controlla la tua email per confermare l’account.',
        ], 201);
    });
});

Route::get('/verify-email/{id}/{hash}', function (Request $request, int $id, string $hash) {
    if (! URL::hasValidSignature($request)) {
        abort(403, 'Link di verifica non valido o scaduto.');
    }

    $user = User::findOrFail($id);

    if (sha1($user->email) !== $hash) {
        abort(403, 'Link di verifica non valido.');
    }

    if (! $user->email_verified_at) {
        $user->email_verified_at = now();
        $user->save();
    }

    $frontendLogin = config('services.frontend_login_url');

    return redirect()->away($frontendLogin . '?verified=1');
})->name('verification.verify');

// Inviti: accetta invito (pubblico, senza auth)
Route::get('/invitations/accept', function (Request $request) {
    $token = $request->query('token');
    if (! $token) {
        return response()->json(['error' => 'Token mancante.'], 400);
    }
    $invitation = Invitation::where('token', $token)->first();
    if (! $invitation || ! $invitation->isValid()) {
        return response()->json(['error' => 'Invito non valido o scaduto.'], 404);
    }
    $invitation->load('inviter');
    return response()->json([
        'inviter_name' => $invitation->inviter->name,
        'invited_email' => $invitation->invited_email,
    ]);
});

Route::post('/invitations/accept', function (Request $request) {
    $data = $request->validate([
        'token' => 'required|string',
        'name' => 'required|string|max:255',
        'password' => 'required|string|min:8|confirmed',
    ]);
    $invitation = Invitation::where('token', $data['token'])->first();
    if (! $invitation || ! $invitation->isValid()) {
        throw ValidationException::withMessages(['token' => ['Invito non valido o scaduto.']]);
    }
    $invitation->load('inviter');
    $inviter = $invitation->inviter;
    $email = $invitation->invited_email;

    $user = User::where('email', $email)->first();
    if (! $user) {
        $user = User::create([
            'name' => $data['name'],
            'email' => $email,
            'password' => $data['password'],
            'email_verified_at' => now(),
        ]);
    } else {
        $user->update([
            'name' => $data['name'],
            'password' => $data['password'],
            'email_verified_at' => now(),
        ]);
    }

    $freezerIds = $inviter->accessibleFreezerIds();
    if ($freezerIds !== []) {
        $user->sharedFreezers()->syncWithoutDetaching($freezerIds);
    }

    $invitation->update(['used_at' => now()]);

    return response()->json([
        'message' => 'Accesso attivato. Ora puoi accedere con le tue credenziali e vedere gli stessi freezer.',
    ]);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', function (Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    });

    Route::get('/user', function (Request $request) {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ]);
    });

    // ---------- Freezers ----------
    Route::get('/freezers', function (Request $request) {
        return $request->user()->accessibleFreezers()->get();
    });

    Route::post('/freezers', function (Request $request) {
        $data = $request->validate(['name' => 'required|string|max:255']);
        return $request->user()->freezers()->create($data);
    });

    Route::get('/freezers/{freezer}', function (Request $request, Freezer $freezer) {
        if (! $request->user()->canAccessFreezer($freezer)) {
            abort(404);
        }
        return $freezer->load('products.tags');
    });

    Route::put('/freezers/{freezer}', function (Request $request, Freezer $freezer) {
        if (! $request->user()->canAccessFreezer($freezer)) {
            abort(404);
        }
        $data = $request->validate(['name' => 'required|string|max:255']);
        $freezer->update($data);
        return $freezer;
    });

    Route::delete('/freezers/{freezer}', function (Request $request, Freezer $freezer) {
        if (! $request->user()->canAccessFreezer($freezer)) {
            abort(404);
        }
        if ($freezer->user_id !== $request->user()->id) {
            abort(403, 'Solo il proprietario può eliminare il freezer.');
        }
        $freezer->delete();
        return response()->json(null, 204);
    });

    // ---------- Tags ----------
    Route::get('/tags', function (Request $request) {
        return $request->user()->tags()->orderBy('name')->get();
    });

    Route::post('/tags', function (Request $request) {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
        ]);
        return $request->user()->tags()->create($data);
    });

    Route::put('/tags/{tag}', function (Request $request, Tag $tag) {
        if ($tag->user_id !== $request->user()->id) {
            abort(404);
        }
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
        ]);
        $tag->update($data);
        return $tag;
    });

    Route::delete('/tags/{tag}', function (Request $request, Tag $tag) {
        if ($tag->user_id !== $request->user()->id) {
            abort(404);
        }
        $tag->delete();
        return response()->json(null, 204);
    });

    // ---------- Products ----------
    // Tutti i prodotti (tutti i freezer accessibili) o solo di un freezer
    Route::get('/products', function (Request $request) {
        $user = $request->user();
        $freezerId = $request->query('freezer_id');
        $accessibleIds = $user->accessibleFreezerIds();
        if ($freezerId) {
            if (! in_array((int) $freezerId, $accessibleIds, true)) {
                abort(404);
            }
            return Freezer::findOrFail($freezerId)->products()->with('tags')->orderBy('name')->get();
        }
        return Product::whereIn('freezer_id', $accessibleIds)->with(['freezer', 'tags'])->orderBy('name')->get();
    });

    Route::post('/products', function (Request $request) {
        $user = $request->user();
        // FormData invia tag_ids come stringa JSON; convertiamo in array per la validazione
        $tagIdsRaw = $request->input('tag_ids');
        if (is_string($tagIdsRaw)) {
            $decoded = json_decode($tagIdsRaw, true);
            $request->merge(['tag_ids' => is_array($decoded) ? $decoded : []]);
        }
        $freezer = Freezer::findOrFail($request->input('freezer_id'));
        if (! $user->canAccessFreezer($freezer)) {
            abort(404);
        }
        $data = $request->validate([
            'freezer_id' => 'required|exists:freezers,id',
            'name' => 'required|string|max:255',
            'brand' => 'nullable|string|max:255',
            'expiry_date' => 'nullable|date',
            'quantity' => 'nullable|numeric|min:0',
            'quantity_unit' => 'nullable|string|max:20',
            'pieces' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:2000',
            'icon' => 'nullable|string|max:80',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
        ]);
        $tagIds = $data['tag_ids'] ?? [];
        unset($data['tag_ids']);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        $product = $freezer->products()->create($data);
        if (!empty($tagIds)) {
            $product->tags()->sync(array_unique($tagIds));
        }

        FreezerLog::create([
            'user_id' => $user->id,
            'freezer_id' => $freezer->id,
            'action' => 'added',
            'product_id' => $product->id,
            'product_name' => $product->name,
            'icon' => $product->icon,
            'brand' => $product->brand,
            'product_image_path' => $product->image_path,
            'expiry_date' => $product->expiry_date,
            'quantity' => $product->quantity,
            'quantity_unit' => $product->quantity_unit,
            'pieces' => $product->pieces,
            'notes' => $product->notes,
            'tags_snapshot' => $product->tags->pluck('name')->values()->all(),
        ]);

        return $product->load('tags');
    });

    Route::get('/products/{product}', function (Request $request, Product $product) {
        if (! $request->user()->canAccessFreezer($product->freezer)) {
            abort(404);
        }
        return $product->load(['freezer', 'tags']);
    });

    Route::put('/products/{product}', function (Request $request, Product $product) {
        if (! $request->user()->canAccessFreezer($product->freezer)) {
            abort(404);
        }
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'brand' => 'nullable|string|max:255',
            'expiry_date' => 'nullable|date',
            'quantity' => 'nullable|numeric|min:0',
            'quantity_unit' => 'nullable|string|max:20',
            'pieces' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:2000',
            'icon' => 'nullable|string|max:80',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
        ]);
        $tagIds = $data['tag_ids'] ?? null;
        unset($data['tag_ids']);
        if ($request->hasFile('image')) {
            if ($product->image_path) Storage::disk('public')->delete($product->image_path);
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }
        $product->update($data);
        if ($tagIds !== null) $product->tags()->sync(array_unique($tagIds));
        return $product->fresh(['freezer', 'tags']);
    });

    // Update con FormData (multipart): POST perché PUT non popola $request->all() in PHP
    Route::post('/products/{product}/update', function (Request $request, Product $product) {
        if (! $request->user()->canAccessFreezer($product->freezer)) {
            abort(404);
        }
        $tagIdsRaw = $request->input('tag_ids');
        $tagIds = is_string($tagIdsRaw) ? json_decode($tagIdsRaw, true) : $tagIdsRaw;
        $oldName = $product->name;
        $oldFreezerId = $product->freezer_id;
        $oldQuantity = $product->quantity;
        $oldPieces = $product->pieces;
        $iconVal = $request->input('icon');
        $newFreezerId = $request->input('freezer_id') ? (int) $request->input('freezer_id') : null;
        if ($newFreezerId && ! in_array($newFreezerId, $request->user()->accessibleFreezerIds(), true)) {
            abort(422, 'Freezer non valido.');
        }
        $data = [
            'freezer_id' => $newFreezerId ?: $product->freezer_id,
            'name' => $request->input('name'),
            'brand' => $request->input('brand') ?: null,
            'expiry_date' => $request->input('expiry_date') ?: null,
            'quantity' => $request->input('quantity') !== '' && $request->input('quantity') !== null ? (float) $request->input('quantity') : null,
            'quantity_unit' => $request->input('quantity_unit') ?: null,
            'pieces' => $request->input('pieces') !== '' && $request->input('pieces') !== null ? (int) $request->input('pieces') : null,
            'notes' => $request->input('notes') ?: null,
            'icon' => $iconVal === '' || $iconVal === null ? null : $iconVal,
        ];
        $request->validate([
            'freezer_id' => 'required|exists:freezers,id',
            'name' => 'required|string|max:255',
            'brand' => 'nullable|string|max:255',
            'expiry_date' => 'nullable|date',
            'quantity' => 'nullable|numeric|min:0',
            'quantity_unit' => 'nullable|string|max:20',
            'pieces' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:2000',
        ]);
        if ($request->hasFile('image')) {
            if ($product->image_path) Storage::disk('public')->delete($product->image_path);
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }
        $product->update($data);
        if (is_array($tagIds)) $product->tags()->sync(array_unique($tagIds));

        // Storico: registra modifica se nome, freezer, peso o pezzi sono cambiati
        $nameChanged = trim((string) $oldName) !== trim((string) ($data['name'] ?? ''));
        $freezerChanged = (int) $oldFreezerId !== (int) ($data['freezer_id'] ?? 0);
        $newQty = $data['quantity'];
        $newPcs = $data['pieces'];
        $quantityChanged = ($oldQuantity === null || $oldQuantity === '') !== ($newQty === null)
            || ($newQty !== null && abs((float) $oldQuantity - (float) $newQty) >= 0.001);
        $piecesChanged = (int) ($oldPieces ?? 0) !== (int) ($newPcs ?? 0);
        $modifiedFields = array_values(array_filter([
            $nameChanged ? 'name' : null,
            $freezerChanged ? 'freezer' : null,
            $quantityChanged ? 'quantity' : null,
            $piecesChanged ? 'pieces' : null,
        ]));
        if ($modifiedFields !== []) {
            $product->load('tags');
            FreezerLog::create([
                'user_id' => $request->user()->id,
                'freezer_id' => $product->freezer_id,
                'action' => 'quantity_updated',
                'modified_fields' => $modifiedFields,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'icon' => $product->icon,
                'brand' => $product->brand,
                'product_image_path' => $product->image_path,
                'expiry_date' => $product->expiry_date,
                'quantity' => $product->quantity,
                'quantity_unit' => $product->quantity_unit,
                'pieces' => $product->pieces,
                'notes' => $product->notes,
                'tags_snapshot' => $product->tags->pluck('name')->values()->all(),
            ]);
        }

        return $product->fresh(['freezer', 'tags']);
    });

    Route::delete('/products/{product}', function (Request $request, Product $product) {
        if (! $request->user()->canAccessFreezer($product->freezer)) {
            abort(404);
        }
        $user = $request->user();
        FreezerLog::create([
            'user_id' => $user->id,
            'freezer_id' => $product->freezer_id,
            'action' => 'removed',
            'product_id' => null,
            'product_name' => $product->name,
            'icon' => $product->icon,
            'brand' => $product->brand,
            'product_image_path' => $product->image_path,
            'expiry_date' => $product->expiry_date,
            'quantity' => $product->quantity,
            'quantity_unit' => $product->quantity_unit,
            'pieces' => $product->pieces,
            'notes' => $product->notes,
            'tags_snapshot' => $product->tags->pluck('name')->values()->all(),
        ]);
        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }
        $product->delete();
        return response()->json(null, 204);
    });

    // URL pubblico per immagine prodotto (path relativo da frontend)
    Route::get('/products/{product}/image', function (Request $request, Product $product) {
        if (! $request->user()->canAccessFreezer($product->freezer)) {
            abort(404);
        }
        if (!$product->image_path) {
            abort(404);
        }
        return response()->file(Storage::disk('public')->path($product->image_path));
    });

    // ---------- Storico ----------
    Route::get('/history', function (Request $request) {
        $freezerIds = $request->user()->accessibleFreezerIds();
        return FreezerLog::whereIn('freezer_id', $freezerIds)
            ->with('freezer:id,name')
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();
    });

    // ---------- Inviti (condivisione account) ----------
    Route::post('/invitations', function (Request $request) {
        $request->validate(['email' => 'required|email']);
        $user = $request->user();
        $email = strtolower($request->input('email'));

        if ($email === strtolower($user->email)) {
            throw ValidationException::withMessages(['email' => ['Non puoi invitare il tuo stesso indirizzo.']]);
        }

        $existing = User::where('email', $email)->first();
        if ($existing && array_intersect($existing->accessibleFreezerIds(), $user->accessibleFreezerIds()) !== []) {
            throw ValidationException::withMessages(['email' => ['Questo utente ha già accesso.']]);
        }

        $invitation = Invitation::create([
            'inviter_id' => $user->id,
            'invited_email' => $email,
            'token' => Invitation::generateToken(),
            'expires_at' => now()->addDays(7),
        ]);

        $acceptUrl = rtrim(config('services.frontend_login_url'), '/');
        $acceptUrl = preg_replace('#/login$#', '', $acceptUrl) . '/invite/accept?token=' . $invitation->token;

        Mail::raw(
            "Ciao,\n\n{$user->name} ti ha invitato a usare il suo account Freezer Organizer. Clicca sul link qui sotto per accettare e creare il tuo accesso (stessi freezer e prodotti):\n\n{$acceptUrl}\n\nIl link scade tra 7 giorni.\n\nSe non conosci {$user->name}, ignora questa email.",
            function ($message) use ($email, $user) {
                $message->to($email)
                    ->subject("Invito da {$user->name} - Freezer Organizer");
            }
        );

        return response()->json(['message' => 'Invito inviato. L\'utente riceverà un\'email con il link per accettare.'], 201);
    });

});
