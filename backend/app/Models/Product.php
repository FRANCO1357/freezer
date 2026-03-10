<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    protected $fillable = [
        'freezer_id',
        'name',
        'brand',
        'image_path',
        'expiry_date',
        'quantity',
        'quantity_unit',
        'pieces',
        'notes',
        'icon',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }
        $url = Storage::disk('public')->url($this->image_path);
        // Garantisce URL assoluto (il frontend può essere su altro origin)
        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            return $url;
        }
        return rtrim(config('app.url'), '/') . '/' . ltrim($url, '/');
    }

    protected function casts(): array
    {
        return [
            'expiry_date' => 'date',
            'quantity' => 'decimal:2',
        ];
    }

    public function freezer(): BelongsTo
    {
        return $this->belongsTo(Freezer::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'product_tag')->withTimestamps();
    }
}
