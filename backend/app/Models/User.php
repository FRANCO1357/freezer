<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function freezers(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Freezer::class);
    }

    /** Freezers condivisi con questo utente (non è il proprietario). */
    public function sharedFreezers(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Freezer::class, 'freezer_user')->withTimestamps();
    }

    /** ID di tutti i freezer a cui l'utente ha accesso (propri + condivisi). */
    public function accessibleFreezerIds(): array
    {
        $owned = $this->freezers()->pluck('id')->toArray();
        $shared = $this->sharedFreezers()->pluck('freezers.id')->toArray();

        return array_values(array_unique(array_merge($owned, $shared)));
    }

    /** Query builder per tutti i freezer accessibili (propri + condivisi). */
    public function accessibleFreezers(): \Illuminate\Database\Eloquent\Builder
    {
        $ids = $this->accessibleFreezerIds();

        return Freezer::whereIn('id', $ids)->orderBy('name');
    }

    /** Verifica se l'utente può accedere al freezer (proprietario o condiviso). */
    public function canAccessFreezer(Freezer $freezer): bool
    {
        return $freezer->user_id === $this->id
            || $this->sharedFreezers()->where('freezers.id', $freezer->id)->exists();
    }

    public function tags(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Tag::class);
    }

    public function freezerLogs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(FreezerLog::class);
    }
}
