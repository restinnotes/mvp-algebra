'use client';

import React from 'react';
import { useDynamicScaffold } from './useDynamicScaffold';
import { DebugPanel } from './DebugPanel';
import { ProblemDisplay } from './ProblemDisplay';
import { ProgressPanel } from './ProgressPanel';
import { WhiteboardArea } from './WhiteboardArea';
import { PersonaModal } from './PersonaModal';

export default function DynamicScaffold() {
    const {
        padRef,
        isProcessingOcr,
        isDecomposing,
        recognizedLatex,

        problemText,
        problemImage,
        isStrategyApproved,
        setIsStrategyApproved,
        isRecording,
        strategyTranscript,
        setStrategyTranscript,
        isEvaluatingStrategy,
        strategyFeedback,
        setStrategyFeedback,
        isSolved,
        manualCalcInput,
        setManualCalcInput,
        isAuxCalculating,
        reviewSummary,
        isGeneratingReview,
        recordingTarget,
        persona,
        showPersonaModal,
        setShowPersonaModal,
        showDebug,
        setShowDebug,
        activeTool,
        setActiveTool,
        logs,
        setLogs,
        stepLogs,
        setStepLogs,
        clearPad,
        cheatSkip,
        cheatCompleteAll,
        handleOcrSubmit,
        handleProblemUpload,
        handleAuxCalculate,
        isDemoRunning,
        isManualDemo,
        manualDemoStep,
        setManualDemoStep,
        demoSteps,
        handleDemoOcr,
        startManualDemo,
        startDemo,
        toggleRecording,
        submitStrategy,
        handleManualSubmit
    } = useDynamicScaffold();

    return (
        <div className="w-full h-full flex flex-col gap-4 relative">
            <DebugPanel
                isManualDemo={isManualDemo}
                isDemoRunning={isDemoRunning}
                stepLogsLength={stepLogs.length}
                demoStepsLength={demoSteps.length}
                showDebug={showDebug}
                logs={logs}
                handleDemoOcr={handleDemoOcr}
                startManualDemo={startManualDemo}
                startDemo={startDemo}
                setShowDebug={setShowDebug}
                cheatSkip={cheatSkip}
                cheatCompleteAll={cheatCompleteAll}
                setLogs={setLogs}
            />

            {/* ===== Top Section: Problem (Left) + Progress (Right) ===== */}
            <div className="flex flex-col md:flex-row gap-4 h-[38%]">
                {/* Left: Problem */}
                <ProblemDisplay
                    handleProblemUpload={handleProblemUpload}
                    isDecomposing={isDecomposing}
                    problemText={problemText}
                    problemImage={problemImage}
                />

                {/* Right: Progress */}
                <ProgressPanel
                    isSolved={isSolved}
                    reviewSummary={reviewSummary}
                    isGeneratingReview={isGeneratingReview}
                    setShowPersonaModal={setShowPersonaModal}
                    stepLogs={stepLogs}
                    isManualDemo={isManualDemo}
                    manualDemoStep={manualDemoStep}
                    setManualDemoStep={setManualDemoStep}
                    demoSteps={demoSteps}
                    setStepLogs={setStepLogs}
                    setIsStrategyApproved={setIsStrategyApproved}
                    setStrategyTranscript={setStrategyTranscript}
                    setStrategyFeedback={setStrategyFeedback}
                    setManualCalcInput={setManualCalcInput}
                    handleDemoOcr={handleDemoOcr}
                />
            </div>

            {/* ===== Bottom: Whiteboard ===== */}
            <WhiteboardArea
                padRef={padRef}
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                clearPad={clearPad}
                isStrategyApproved={isStrategyApproved}
                strategyTranscript={strategyTranscript}
                setStrategyTranscript={setStrategyTranscript}
                isRecording={isRecording}
                recordingTarget={recordingTarget}
                toggleRecording={toggleRecording}
                strategyFeedback={strategyFeedback}
                submitStrategy={submitStrategy}
                isEvaluatingStrategy={isEvaluatingStrategy}
                isManualDemo={isManualDemo}
                handleDemoOcr={handleDemoOcr}
                demoSteps={demoSteps}
                manualDemoStep={manualDemoStep}
                recognizedLatex={recognizedLatex}
                isSolved={isSolved}
                manualCalcInput={manualCalcInput}
                setManualCalcInput={setManualCalcInput}
                handleManualSubmit={handleManualSubmit}
                handleAuxCalculate={handleAuxCalculate}
                isAuxCalculating={isAuxCalculating}
                isProcessingOcr={isProcessingOcr}
                handleOcrSubmit={handleOcrSubmit}
                stepLogsLength={stepLogs.length}
            />

            {/* ===== PERSONA MODAL ===== */}
            <PersonaModal
                showPersonaModal={showPersonaModal}
                persona={persona}
                reviewSummary={reviewSummary}
                setShowPersonaModal={setShowPersonaModal}
            />
        </div>
    );
}
