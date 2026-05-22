<?php

namespace Modules\Vector\Models;

use Illuminate\Database\Eloquent\Model;

class ManualVector extends Model
{
    // Bind this model to the PostgreSQL vector connection
    protected $connection = 'pgsql_vector';
    protected $table = 'manual_vectors';

    public $timestamps = false;
    protected $fillable = ['content'];
}
