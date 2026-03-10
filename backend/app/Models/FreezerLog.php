<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FreezerLog extends Model
{
    protected $fillable = [
        'user_id',
        'freezer_id',
        'action',
        'modified_fields',
        'product_id',
        'product_name',
        'brand',
        'product_image_path',
        'expiry_date',
        'quantity',
        'quantity_unit',
        'pieces',
        'notes',
        'tags_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'expiry_date' => 'date',
            'quantity' => 'decimal:2',
            'tags_snapshot' => 'array',
            'modified_fields' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function freezer(): BelongsTo
    {
        return $this->belongsTo(Freezer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
