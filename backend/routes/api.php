<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Public Authentication
Route::post('/login', 'App\Http\Controllers\AuthController@login')->name('login');

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    // Shared Auth endpoints
    Route::post('/logout', 'App\Http\Controllers\AuthController@logout')->name('logout');
    Route::get('/profile', 'App\Http\Controllers\AuthController@profile')->name('profile');

    /**
     * 1. ADMIN ROLE ROUTES
     * Handles User, Class, Subject, and Student administration.
     */
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // Manage Users (Admin, Teacher, Exam Officer)
        Route::apiResource('users', 'App\Http\Controllers\Admin\UserController');

        // Manage Classes
        Route::apiResource('classes', 'App\Http\Controllers\Admin\ClassController');

        // Manage Subjects
        Route::apiResource('subjects', 'App\Http\Controllers\Admin\SubjectController');

        // Manage Students
        Route::apiResource('students', 'App\Http\Controllers\Admin\StudentController');
    });

    /**
     * 2. TEACHER ROLE ROUTES
     * Handles inputting and editing results for their subjects.
     */
    Route::middleware('role:teacher')->prefix('teacher')->group(function () {
        // Manage Results (CA, Exam, total, and grade input)
        Route::get('/results', 'App\Http\Controllers\Teacher\ResultController@index')->name('teacher.results.index');
        Route::post('/results', 'App\Http\Controllers\Teacher\ResultController@store')->name('teacher.results.store');
        Route::get('/results/{result}', 'App\Http\Controllers\Teacher\ResultController@show')->name('teacher.results.show');
        Route::put('/results/{result}', 'App\Http\Controllers\Teacher\ResultController@update')->name('teacher.results.update');

        // Metadata helpers for class, subject, and student selection
        Route::get('/classes', 'App\Http\Controllers\Teacher\ResultController@classes')->name('teacher.classes');
        Route::get('/subjects', 'App\Http\Controllers\Teacher\ResultController@subjects')->name('teacher.subjects');
        Route::get('/students', 'App\Http\Controllers\Teacher\ResultController@students')->name('teacher.students');
    });

    /**
     * 3. EXAM OFFICER ROLE ROUTES
     * Handles result verification, approval, rejection, and school-wide reporting.
     */
    Route::middleware('role:exam_officer')->prefix('exam-officer')->group(function () {
        // Retrieve results awaiting approval
        Route::get('/results/pending', 'App\Http\Controllers\ExamOfficer\ResultController@pending')->name('exam_officer.results.pending');

        // Approve or Reject results
        Route::post('/results/{result}/approve', 'App\Http\Controllers\ExamOfficer\ResultController@approve')->name('exam_officer.results.approve');
        Route::post('/results/{result}/reject', 'App\Http\Controllers\ExamOfficer\ResultController@reject')->name('exam_officer.results.reject');

        // Generate reports
        Route::get('/reports/class/{class}', 'App\Http\Controllers\ExamOfficer\ResultController@classReport')->name('exam_officer.reports.class');
    });
});
