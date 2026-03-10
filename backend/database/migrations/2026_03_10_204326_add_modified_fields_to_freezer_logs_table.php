<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('freezer_logs', function (Blueprint $table) {
            $table->json('modified_fields')->nullable()->after('action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('freezer_logs', function (Blueprint $table) {
            $table->dropColumn('modified_fields');
        });
    }
};
