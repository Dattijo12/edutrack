<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ResultWindow;
use App\Services\AuditService;
use Illuminate\Http\Request;

class ResultWindowController extends Controller
{
    /**
     * Fetch all result windows ordered by session and term.
     */
    public function index()
    {
        $windows = ResultWindow::orderBy('academic_session', 'desc')
            ->orderBy('term', 'asc')
            ->get();

        return response()->json($windows, 200);
    }

    /**
     * Create or update a result window.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_session' => 'required|string',
            'term' => 'required|string',
            'is_open' => 'sometimes|boolean',
        ]);

        $isOpen = $request->has('is_open') ? (bool) $request->input('is_open') : true;
        $isPublished = $request->has('is_published') ? (bool) $request->input('is_published') : false;

        $window = ResultWindow::updateOrCreate(
            [
                'academic_session' => $validated['academic_session'],
                'term' => $validated['term'],
            ],
            [
                'is_open' => $isOpen,
                'is_published' => $isPublished,
            ]
        );

        return response()->json([
            'message' => 'Result window saved successfully.',
            'data' => $window,
        ], 200);
    }

    /**
     * Toggle the is_open status of a specific result window.
     */
    public function toggle(ResultWindow $resultWindow)
    {
        $resultWindow->update([
            'is_open' => !$resultWindow->is_open,
        ]);

        $statusText = $resultWindow->is_open ? 'opened' : 'closed';

        return response()->json([
            'message' => "Result window for {$resultWindow->term} ({$resultWindow->academic_session}) is now {$statusText}.",
            'data' => $resultWindow,
        ], 200);
    }

    /**
     * Toggle the is_published status of a specific result window for the Student Portal.
     */
    public function togglePublish(ResultWindow $resultWindow)
    {
        $resultWindow->update([
            'is_published' => !$resultWindow->is_published,
        ]);

        $statusText = $resultWindow->is_published ? 'published' : 'unpublished';

        // Audit trail: record result publication toggle by Super Admin
        AuditService::log(
            $resultWindow->is_published ? 'results_published' : 'results_unpublished',
            "Results for {$resultWindow->term} ({$resultWindow->academic_session}) are now {$statusText} to the Student Portal.",
            $resultWindow
        );

        return response()->json([
            'message' => "Results for {$resultWindow->term} ({$resultWindow->academic_session}) are now {$statusText} to the Student Portal.",
            'data' => $resultWindow,
        ], 200);
    }

    /**
     * Delete a result window.
     */
    public function destroy(ResultWindow $resultWindow)
    {
        $resultWindow->delete();

        return response()->json([
            'message' => 'Result window deleted successfully.',
        ], 200);
    }
}
