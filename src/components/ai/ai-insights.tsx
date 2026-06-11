"use client";

import * as React from "react";
import { Sparkles, Loader2, Wand2, Map } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api } from "@/lib/fetcher";

interface AIInsightsProps {
  company?: string;
  role?: string;
}

interface SummaryResult {
  mostAskedQuestions: string[];
  commonTopics: string[];
  difficultySummary: string;
}
interface QuestionsResult {
  questions: string[];
}
interface RoadmapResult {
  roadmap: { week: number; focus: string; topics: string[] }[];
}

export function AIInsights({ company, role }: AIInsightsProps) {
  const summary = useMutation({
    mutationFn: () =>
      api.post<SummaryResult & { source: string }>("/api/ai/summary", { company, role }),
  });
  const questions = useMutation({
    mutationFn: () =>
      api.post<QuestionsResult & { source: string }>("/api/ai/questions", {
        company,
        role,
      }),
  });
  const roadmap = useMutation({
    mutationFn: () =>
      api.post<RoadmapResult & { source: string }>("/api/ai/roadmap", { company, role }),
  });

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-primary" /> AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="questions">Mock Qs</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-3">
            <Button
              size="sm"
              onClick={() => summary.mutate()}
              disabled={summary.isPending}
            >
              {summary.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate summary
            </Button>
            {summary.data && (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">{summary.data.difficultySummary}</p>
                <div>
                  <p className="mb-1 font-medium">Most asked questions</p>
                  <ul className="list-inside list-disc space-y-1">
                    {summary.data.mostAskedQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {summary.data.commonTopics.map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="questions" className="space-y-3">
            <Button
              size="sm"
              onClick={() => questions.mutate()}
              disabled={questions.isPending}
            >
              {questions.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Generate mock questions
            </Button>
            {questions.data && (
              <ol className="list-inside list-decimal space-y-1.5 text-sm">
                {questions.data.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-3">
            <Button
              size="sm"
              onClick={() => roadmap.mutate()}
              disabled={roadmap.isPending}
            >
              {roadmap.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Map className="h-4 w-4" />
              )}
              Generate roadmap
            </Button>
            {roadmap.data && (
              <div className="space-y-2 text-sm">
                {roadmap.data.roadmap.map((w) => (
                  <div key={w.week} className="rounded-md border bg-background p-3">
                    <p className="font-medium">
                      Week {w.week}: {w.focus}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {w.topics.map((t, i) => (
                        <Badge key={i} variant="outline">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
