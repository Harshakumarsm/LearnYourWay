'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, Lightbulb, Target, Eye, List, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleLogicAIService, SimpleLogicAIResponse, MultipleQuestionsResponse } from '@/services/simpleLogicAI';

export const LogicAI = () => {
  const navigate = useNavigate();
  const [questionText, setQuestionText] = useState('');
  const [response, setResponse] = useState<SimpleLogicAIResponse | null>(null);
  const [multipleResponses, setMultipleResponses] = useState<MultipleQuestionsResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMultipleMode, setIsMultipleMode] = useState(false);
  
  const [revealedHints, setRevealedHints] = useState<{
    nudge: boolean;
    approach: boolean;
    stepByStep: boolean;
    fullAnswer: boolean;
  }>({
    nudge: false,
    approach: false,
    stepByStep: false,
    fullAnswer: false
  });
  
  // Hint states for multiple questions
  const [multiHintStates, setMultiHintStates] = useState<{[key: string]: {
    nudge: boolean;
    approach: boolean;
    stepByStep: boolean;
    fullAnswer: boolean;
  }}>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    setMultipleResponses(null);
    setRevealedHints({ nudge: false, approach: false, stepByStep: false, fullAnswer: false });
    setMultiHintStates({});

    try {
      // Detect if input likely contains multiple questions using intelligent analysis
      const hasMultipleQuestions = detectMultipleQuestions(questionText);

      if (hasMultipleQuestions) {
        setIsMultipleMode(true);
        const result = await SimpleLogicAIService.processMultipleQuestions(questionText);
        setMultipleResponses(result);
        
        // Initialize hint states for all questions
        const initialHintStates: {[key: string]: {
          nudge: boolean;
          approach: boolean;
          stepByStep: boolean;
          fullAnswer: boolean;
        }} = {};
        result.questions.forEach((q) => {
          initialHintStates[q.id] = {
            nudge: false,
            approach: false,
            stepByStep: false,
            fullAnswer: false
          };
        });
        setMultiHintStates(initialHintStates);
        setCurrentQuestionIndex(0);
      } else {
        setIsMultipleMode(false);
        const result = await SimpleLogicAIService.processTextQuestion(questionText);
        setResponse(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing your question');
    } finally {
      setLoading(false);
    }
  };

  const revealHint = (type: keyof typeof revealedHints) => {
    setRevealedHints(prev => ({ ...prev, [type]: true }));
  };

  const revealMultiHint = (questionId: string, type: keyof typeof revealedHints) => {
    setMultiHintStates(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [type]: true
      }
    }));
  };

  const resetSession = () => {
    setQuestionText('');
    setResponse(null);
    setMultipleResponses(null);
    setIsMultipleMode(false);
    setCurrentQuestionIndex(0);
    setRevealedHints({ nudge: false, approach: false, stepByStep: false, fullAnswer: false });
    setMultiHintStates({});
    setError(null);
  };

  const detectMultipleQuestions = (text: string): boolean => {
    // Check for numbered questions
    const numberedQuestions = text.match(/^\d+[.)]\s*|^Q\d+[.:]?\s*|^Question\s*\d+[.:]?\s*/gm);
    if (numberedQuestions && numberedQuestions.length > 1) {
      return true;
    }

    // Check for multiple question marks
    const questionMarks = (text.match(/\?/g) || []).length;
    if (questionMarks > 1) {
      return true;
    }

    // Check for question words that suggest multiple questions
    const questionWords = ['what', 'why', 'how', 'when', 'where', 'who', 'which'];
    let questionWordCount = 0;
    const sentences = text.toLowerCase().split(/[.!?]\s+/);
    
    for (const sentence of sentences) {
      if (questionWords.some(word => sentence.trim().startsWith(word + ' '))) {
        questionWordCount++;
      }
    }

    return questionWordCount > 1;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const hintVariants = {
    hidden: { opacity: 0, height: 0, y: -10 },
    visible: {
      opacity: 1,
      height: 'auto',
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">LogicAI</h1>
                <p className="text-sm text-muted-foreground">Learn logical approaches to problem solving</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Question Input Section */}
          <motion.div variants={itemVariants}>
            <Card className="bg-card border border-border rounded-xl">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    What question would you like to explore?
                  </h2>
                  <p className="text-muted-foreground">
                    Enter any question - MCQ, word problem, puzzle, or concept - and LogicAI will guide you through the reasoning process.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Ask your question(s) - LogicAI can intelligently detect and analyze multiple questions
                    </label>
                    <Textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Single question:
Why do we see lightning before we hear thunder?

Multiple questions (various formats):
What is photosynthesis? How do plants convert sunlight into energy? Why are leaves green?

1. What causes thunder?
2. How fast does sound travel?
3. What is the relationship between light and sound speed?

Explain gravity. What did Newton discover? How does Einstein's theory differ?"
                      className="min-h-[120px] py-4 px-4 text-base resize-none"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!questionText.trim() || loading}
                      className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Analyze Question'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-4">
                  <p className="text-destructive">{error}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Response Section */}
          <AnimatePresence>
            {response && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Restated Question */}
                <motion.div variants={itemVariants}>
                  <Card className="bg-card border border-border rounded-xl">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        Understanding Your Question
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {response.restated_question}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Reasoning Strategies */}
                <motion.div variants={itemVariants}>
                  <Card className="bg-card border border-border rounded-xl">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        Reasoning Strategies
                      </h3>
                      <div className="grid gap-2">
                        {response.strategies.map((strategy, index) => (
                          <div key={index} className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="capitalize">{strategy}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Progressive Hints */}
                <motion.div variants={itemVariants} className="space-y-4">
                  {/* Nudge */}
                  <div>
                    <Button
                      onClick={() => revealHint('nudge')}
                      disabled={revealedHints.nudge}
                      className="w-full justify-start gap-3 h-auto p-4 bg-card hover:bg-hover-bg border border-border text-foreground"
                      variant="outline"
                    >
                      <Lightbulb className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">Get a Nudge</div>
                        <div className="text-sm text-muted-foreground">A small hint to get you started</div>
                      </div>
                    </Button>
                    
                    <AnimatePresence>
                      {revealedHints.nudge && (
                        <motion.div
                          variants={hintVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <Card className="mt-3 bg-accent/5 border-accent/20">
                            <CardContent className="p-4">
                              <p className="text-foreground">{response.nudge}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Approach Hint */}
                  <div>
                    <Button
                      onClick={() => revealHint('approach')}
                      disabled={revealedHints.approach || !revealedHints.nudge}
                      className="w-full justify-start gap-3 h-auto p-4 bg-card hover:bg-hover-bg border border-border text-foreground"
                      variant="outline"
                    >
                      <Target className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">Approach Strategy</div>
                        <div className="text-sm text-muted-foreground">Learn the method to solve this</div>
                      </div>
                    </Button>
                    
                    <AnimatePresence>
                      {revealedHints.approach && (
                        <motion.div
                          variants={hintVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <Card className="mt-3 bg-accent/5 border-accent/20">
                            <CardContent className="p-4">
                              <p className="text-foreground">{response.approach_hint}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Step-by-Step Reasoning */}
                  <div>
                    <Button
                      onClick={() => revealHint('stepByStep')}
                      disabled={revealedHints.stepByStep || !revealedHints.approach}
                      className="w-full justify-start gap-3 h-auto p-4 bg-card hover:bg-hover-bg border border-border text-foreground"
                      variant="outline"
                    >
                      <Brain className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">Step-by-Step Reasoning</div>
                        <div className="text-sm text-muted-foreground">Detailed reasoning process</div>
                      </div>
                    </Button>
                    
                    <AnimatePresence>
                      {revealedHints.stepByStep && (
                        <motion.div
                          variants={hintVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <Card className="mt-3 bg-accent/5 border-accent/20">
                            <CardContent className="p-4">
                              <div className="whitespace-pre-wrap text-foreground">
                                {response.step_by_step_reasoning}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Reveal Answer Button */}
                  <div>
                    <Button
                      onClick={() => revealHint('fullAnswer')}
                      disabled={revealedHints.fullAnswer || !revealedHints.stepByStep}
                      className="w-full justify-start gap-3 h-auto p-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary"
                      variant="outline"
                    >
                      <Eye className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Reveal Complete Answer</div>
                        <div className="text-sm opacity-80">Show the final solution</div>
                      </div>
                    </Button>
                    
                    <AnimatePresence>
                      {revealedHints.fullAnswer && (
                        <motion.div
                          variants={hintVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <Card className="mt-3 bg-primary/5 border-primary/20">
                            <CardContent className="p-4">
                              <p className="text-foreground font-medium">
                                Complete reasoning provided! Try another question to continue practicing your logical thinking skills.
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Try Another Question */}
                {revealedHints.fullAnswer && (
                  <motion.div variants={itemVariants}>
                    <Button
                      onClick={resetSession}
                      className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Try Another Question
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Multiple Questions Response Section */}
            {multipleResponses && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Questions Navigation */}
                <motion.div variants={itemVariants}>
                  <Card className="bg-card border border-border rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          Multiple Questions Detected ({multipleResponses.total_questions} questions)
                        </h3>
                        <Button
                          onClick={resetSession}
                          variant="outline"
                          size="sm"
                          className="text-sm"
                        >
                          New Session
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {multipleResponses.questions.map((_, index) => (
                          <Button
                            key={index}
                            onClick={() => setCurrentQuestionIndex(index)}
                            variant={currentQuestionIndex === index ? "default" : "outline"}
                            size="sm"
                            className="min-w-[40px]"
                          >
                            {index + 1}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Current Question Display */}
                {multipleResponses.questions[currentQuestionIndex] && (
                  <motion.div
                    key={currentQuestionIndex}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                  >
                    {(() => {
                      const currentQ = multipleResponses.questions[currentQuestionIndex];
                      const currentHints = multiHintStates[currentQ.id] || {
                        nudge: false,
                        approach: false,
                        stepByStep: false,
                        fullAnswer: false
                      };

                      return (
                        <>
                          {/* Question Header */}
                          <motion.div variants={itemVariants}>
                            <Card className="bg-card border border-border rounded-xl">
                              <CardContent className="p-6">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="text-primary font-semibold text-sm">
                                      {currentQuestionIndex + 1}
                                    </span>
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">
                                      Original Question
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed mb-3">
                                      {currentQ.original_text}
                                    </p>
                                    <span className="inline-block px-3 py-1 bg-accent/20 text-accent-foreground text-sm rounded-full">
                                      {currentQ.type}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>

                          {/* Restated Question */}
                          <motion.div variants={itemVariants}>
                            <Card className="bg-card border border-border rounded-xl">
                              <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-3">
                                  Understanding Your Question
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                  {currentQ.response.restated_question}
                                </p>
                              </CardContent>
                            </Card>
                          </motion.div>

                          {/* Reasoning Strategies */}
                          <motion.div variants={itemVariants}>
                            <Card className="bg-card border border-border rounded-xl">
                              <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-3">
                                  Reasoning Strategies
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                  {currentQ.response.strategies.map((strategy, index) => (
                                    <span
                                      key={index}
                                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                                    >
                                      {strategy}
                                    </span>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>

                          {/* Progressive Hints */}
                          <motion.div variants={itemVariants} className="space-y-4">
                            {/* Nudge */}
                            {!currentHints.nudge ? (
                              <Button
                                onClick={() => revealMultiHint(currentQ.id, 'nudge')}
                                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                                variant="outline"
                              >
                                <Lightbulb className="w-4 h-4 mr-2" />
                                Get a Small Nudge
                              </Button>
                            ) : (
                              <motion.div variants={hintVariants} initial="hidden" animate="visible">
                                <Card className="bg-primary/5 border-primary/20">
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                      <div>
                                        <h4 className="font-medium text-primary mb-1">Nudge</h4>
                                        <p className="text-foreground">{currentQ.response.nudge}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )}

                            {/* Approach Hint */}
                            {currentHints.nudge && !currentHints.approach ? (
                              <Button
                                onClick={() => revealMultiHint(currentQ.id, 'approach')}
                                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                                variant="outline"
                              >
                                <Target className="w-4 h-4 mr-2" />
                                Show Approach Strategy
                              </Button>
                            ) : currentHints.approach ? (
                              <motion.div variants={hintVariants} initial="hidden" animate="visible">
                                <Card className="bg-primary/5 border-primary/20">
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                      <div>
                                        <h4 className="font-medium text-primary mb-1">Approach Strategy</h4>
                                        <p className="text-foreground">{currentQ.response.approach_hint}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ) : null}

                            {/* Step-by-Step Reasoning */}
                            {currentHints.approach && !currentHints.stepByStep ? (
                              <Button
                                onClick={() => revealMultiHint(currentQ.id, 'stepByStep')}
                                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                                variant="outline"
                              >
                                <List className="w-4 h-4 mr-2" />
                                Show Step-by-Step Reasoning
                              </Button>
                            ) : currentHints.stepByStep ? (
                              <motion.div variants={hintVariants} initial="hidden" animate="visible">
                                <Card className="bg-primary/5 border-primary/20">
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <List className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                      <div>
                                        <h4 className="font-medium text-primary mb-1">Step-by-Step Reasoning</h4>
                                        <div className="text-foreground whitespace-pre-line">
                                          {currentQ.response.step_by_step_reasoning}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ) : null}
                          </motion.div>

                          {/* Navigation */}
                          <motion.div variants={itemVariants}>
                            <div className="flex justify-between items-center">
                              <Button
                                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                disabled={currentQuestionIndex === 0}
                                variant="outline"
                              >
                                Previous Question
                              </Button>
                              <Button
                                onClick={() => setCurrentQuestionIndex(Math.min(multipleResponses.questions.length - 1, currentQuestionIndex + 1))}
                                disabled={currentQuestionIndex === multipleResponses.questions.length - 1}
                                variant="outline"
                              >
                                Next Question
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </div>
                          </motion.div>
                        </>
                      );
                    })()}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};