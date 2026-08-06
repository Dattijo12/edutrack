<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Endpoints
Route::post('/login', 'App\Http\Controllers\AuthController@login')->name('login');
Route::get('/verify-result/{hash}', 'App\Http\Controllers\ExamOfficer\BroadsheetController@verifyResult')->name('result.verify');
Route::get('/school-settings', 'App\Http\Controllers\Admin\SchoolSettingController@show')->name('school.settings.public');

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    // Shared Auth endpoints
    Route::post('/logout', 'App\Http\Controllers\AuthController@logout')->name('logout');
    Route::get('/profile', 'App\Http\Controllers\AuthController@profile')->name('profile');
    Route::post('/change-password', 'App\Http\Controllers\AuthController@changePassword')->name('change_password');

    /**
     * 1. ADMIN ROLE ROUTES
     */
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::apiResource('users', 'App\Http\Controllers\Admin\UserController');
        Route::apiResource('classes', 'App\Http\Controllers\Admin\ClassController');
        Route::apiResource('subjects', 'App\Http\Controllers\Admin\SubjectController');
        Route::apiResource('students', 'App\Http\Controllers\Admin\StudentController');
        
        // School Settings
        Route::get('/settings', 'App\Http\Controllers\Admin\SchoolSettingController@show');
        Route::put('/settings', 'App\Http\Controllers\Admin\SchoolSettingController@update');

        // Subject Assignments
        Route::get('/subject-assignments', 'App\Http\Controllers\Admin\SubjectAssignmentController@index');
        Route::post('/subject-assignments', 'App\Http\Controllers\Admin\SubjectAssignmentController@store');
        Route::delete('/subject-assignments/{assignment}', 'App\Http\Controllers\Admin\SubjectAssignmentController@destroy');

        // 1-Click Class Promotion
        Route::post('/promote-class', 'App\Http\Controllers\Admin\PromotionController@promote');
    });

    /**
     * 2. TEACHER ROLE ROUTES
     */
    Route::middleware('role:teacher,admin,form_master')->prefix('teacher')->group(function () {
        Route::get('/results', 'App\Http\Controllers\Teacher\ResultController@index')->name('teacher.results.index');
        Route::post('/results', 'App\Http\Controllers\Teacher\ResultController@store')->name('teacher.results.store');
        Route::get('/results/{result}', 'App\Http\Controllers\Teacher\ResultController@show')->name('teacher.results.show');
        Route::put('/results/{result}', 'App\Http\Controllers\Teacher\ResultController@update')->name('teacher.results.update');

        Route::get('/classes', 'App\Http\Controllers\Teacher\ResultController@classes')->name('teacher.classes');
        Route::get('/subjects', 'App\Http\Controllers\Teacher\ResultController@subjects')->name('teacher.subjects');
        Route::get('/students', 'App\Http\Controllers\Teacher\ResultController@students')->name('teacher.students');
        Route::get('/max-scores', 'App\Http\Controllers\Teacher\ResultController@maxScores')->name('teacher.max_scores');
    });

    /**
     * 3. BURSAR ROLE ROUTES
     */
    Route::middleware('role:bursar,admin')->prefix('bursar')->group(function () {
        Route::get('/students', 'App\Http\Controllers\Bursar\FeePaymentController@index');
        Route::post('/record-payment', 'App\Http\Controllers\Bursar\FeePaymentController@recordPayment');
        Route::post('/students/{student}/toggle-clearance', 'App\Http\Controllers\Bursar\FeePaymentController@toggleClearance');
    });

    /**
     * 4. FORM MASTER ROLE ROUTES
     */
    Route::middleware('role:form_master,admin')->prefix('form-master')->group(function () {
        Route::get('/assigned-class', 'App\Http\Controllers\FormMaster\ClassManagementController@assignedClass');
        Route::post('/update-remarks', 'App\Http\Controllers\FormMaster\ClassManagementController@updateRemarks');
    });

    /**
     * 5. EXAM OFFICER ROLE ROUTES
     */
    Route::middleware('role:exam_officer,admin')->prefix('exam-officer')->group(function () {
        Route::get('/results/pending', 'App\Http\Controllers\ExamOfficer\ResultController@pending')->name('exam_officer.results.pending');
        Route::post('/results/{result}/approve', 'App\Http\Controllers\ExamOfficer\ResultController@approve')->name('exam_officer.results.approve');
        Route::post('/results/{result}/reject', 'App\Http\Controllers\ExamOfficer\ResultController@reject')->name('exam_officer.results.reject');
        
        Route::get('/reports/class/{class}', 'App\Http\Controllers\ExamOfficer\ResultController@classReport')->name('exam_officer.reports.class');
        Route::get('/broadsheet/{class}', 'App\Http\Controllers\ExamOfficer\BroadsheetController@generateBroadsheet');
        Route::get('/report-card/{student}', 'App\Http\Controllers\ExamOfficer\BroadsheetController@generateReportCard');
    });
});
