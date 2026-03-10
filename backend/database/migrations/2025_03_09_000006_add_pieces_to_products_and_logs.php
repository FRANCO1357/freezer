<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('pieces')->nullable()->after('quantity_unit'); // numero di pezzi (es. 5 filetti)
        });
        Schema::table('freezer_logs', function (Blueprint $table) {
            $table->unsignedInteger('pieces')->nullable()->after('quantity_unit');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('pieces');
        });
        Schema::table('freezer_logs', function (Blueprint $table) {
            $table->dropColumn('pieces');
        });
    }
};
