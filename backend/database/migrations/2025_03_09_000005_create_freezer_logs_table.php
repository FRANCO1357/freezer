<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('freezer_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('freezer_id')->constrained()->cascadeOnDelete();
            $table->string('action'); // 'added', 'removed'
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->string('product_image_path')->nullable();
            $table->date('expiry_date')->nullable();
            $table->decimal('quantity', 10, 2)->nullable();
            $table->string('quantity_unit', 20)->nullable();
            $table->json('tags_snapshot')->nullable(); // nomi tag al momento dell'azione
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('freezer_logs');
    }
};
