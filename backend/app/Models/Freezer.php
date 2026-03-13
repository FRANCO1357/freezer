<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Freezer extends Model
{
    protected $fillable = ['user_id', 'name'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Utenti con cui il freezer è condiviso (escluso il proprietario). */
    public function sharedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'freezer_user')->withTimestamps();
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(FreezerLog::class, 'freezer_id');
    }
}
