<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class MailSetting extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'mail_settings';

    protected $fillable = [
        'user_id',
        'mail_server',
        'mail_port',
        'mail_username',
        'mail_password',
        'mail_encryption',
        'mail_from_address',
        'mail_from_name',
        'is_active'
    ];

    protected $hidden = [
        'mail_password'
    ];

    protected $attributes = [
        'is_active' => true,
        'mail_encryption' => 'tls',
        'mail_port' => '587'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}