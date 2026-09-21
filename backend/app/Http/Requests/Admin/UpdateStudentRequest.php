<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $studentId = $this->route('student')->id;

        return [
            'name' => 'required|string|max:255',
            'admission_number' => 'required|string|max:100|unique:students,admission_number,' . $studentId,
            'class_id' => 'required|exists:classes,id',
            'gender' => 'required|in:Male,Female',
            'dob' => 'required|date',
            'parent_phone' => 'required|digits:11',
            'guardian_phone' => 'nullable|digits:11',
        ];
    }
}
