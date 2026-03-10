<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('brand', 255)->nullable()->after('name');
            $table->text('notes')->nullable()->after('pieces');
        });
        Schema::table('freezer_logs', function (Blueprint $table) {
            $table->string('brand', 255)->nullable()->after('product_name');
            $table->text('notes')->nullable()->after('pieces');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['brand', 'notes']);
        });
        Schema::table('freezer_logs', function (Blueprint $table) {
            $table->dropColumn(['brand', 'notes']);
        });
    }
};
