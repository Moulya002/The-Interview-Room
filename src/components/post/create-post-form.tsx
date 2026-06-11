"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListInput } from "@/components/ui/list-input";
import { RoundBuilder } from "@/components/post/round-builder";
import { createPostSchema, type CreatePostInput } from "@/lib/validations";
import {
  EXPERIENCE_LEVELS,
  INTERVIEW_TYPES,
  OUTCOMES,
} from "@/lib/constants";
import { useCreatePost } from "@/hooks/use-posts";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";
import type { PostDTO } from "@/types";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function CreatePostForm({ post }: { post?: PostDTO }) {
  const router = useRouter();
  const { toast } = useToast();
  const createPost = useCreatePost();
  const isEdit = Boolean(post);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createPostSchema) as any,
    defaultValues: {
      title: post?.title ?? "",
      company: post?.company ?? "",
      role: post?.role ?? "",
      location: post?.location ?? "",
      experienceLevel: (post?.experienceLevel as never) ?? "Mid Level",
      interviewType: (post?.interviewType as never) ?? "Onsite",
      interviewDate: post?.interviewDate?.slice(0, 10) ?? undefined,
      rounds: post?.rounds ?? 1,
      outcome: (post?.outcome as never) ?? "Pending",
      difficulty: post?.difficulty ?? 5,
      salaryMin: post?.salaryMin ?? undefined,
      salaryMax: post?.salaryMax ?? undefined,
      salaryCurrency: post?.salaryCurrency ?? "USD",
      preparationResources: post?.preparationResources ?? [],
      questions: post?.questions ?? [],
      tags: post?.tags ?? [],
      roundBreakdown: post?.roundBreakdown ?? [],
      tips: post?.tips ?? "",
      content: post?.content ?? "",
      isAnonymous: post?.isAnonymous ?? false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && post) {
        const updated = await api.patch<PostDTO>(`/api/posts/${post.slug}`, values);
        toast({ title: "Experience updated!" });
        router.push(`/post/${updated.slug}`);
      } else {
        const created = await createPost.mutateAsync(values);
        toast({ title: "Experience published!" });
        router.push(`/post/${created.slug}`);
      }
    } catch (err) {
      toast({
        title: "Could not save",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>The basics</CardTitle>
          <CardDescription>
            Tell us where you interviewed and for what role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Title" error={errors.title?.message}>
            <Input
              placeholder="My Software Engineer interview at Google"
              {...register("title")}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" error={errors.company?.message}>
              <Input placeholder="Google" {...register("company")} />
            </Field>
            <Field label="Role" error={errors.role?.message}>
              <Input placeholder="Software Engineer" {...register("role")} />
            </Field>
            <Field label="Location" error={errors.location?.message}>
              <Input placeholder="Remote / Bangalore" {...register("location")} />
            </Field>
            <Field label="Interview date">
              <Input type="date" {...register("interviewDate")} />
            </Field>
            <Field label="Experience level">
              <Controller
                control={control}
                name="experienceLevel"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Interview type">
              <Controller
                control={control}
                name="interviewType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVIEW_TYPES.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Process & outcome</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Number of rounds" error={errors.rounds?.message}>
              <Input type="number" min={1} max={20} {...register("rounds")} />
            </Field>
            <Field label="Outcome">
              <Controller
                control={control}
                name="outcome"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTCOMES.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Difficulty (1-10)" error={errors.difficulty?.message}>
              <Controller
                control={control}
                name="difficulty"
                render={({ field }) => (
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <span className="w-8 text-center text-sm font-semibold">
                      {field.value}
                    </span>
                  </div>
                )}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Salary min (optional)" error={errors.salaryMin?.message}>
              <Input type="number" placeholder="120000" {...register("salaryMin")} />
            </Field>
            <Field label="Salary max (optional)" error={errors.salaryMax?.message}>
              <Input type="number" placeholder="160000" {...register("salaryMax")} />
            </Field>
            <Field label="Currency">
              <Input placeholder="USD" {...register("salaryCurrency")} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Round breakdown</CardTitle>
          <CardDescription>
            Break down each round so others know what to expect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="roundBreakdown"
            render={({ field }) => (
              <RoundBuilder value={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions, tips & resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Questions asked">
            <Controller
              control={control}
              name="questions"
              render={({ field }) => (
                <ListInput
                  variant="list"
                  value={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Add a question you were asked..."
                />
              )}
            />
          </Field>
          <Field label="Preparation resources">
            <Controller
              control={control}
              name="preparationResources"
              render={({ field }) => (
                <ListInput
                  variant="list"
                  value={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Add a resource (book, course, link)..."
                />
              )}
            />
          </Field>
          <Field label="Tips & advice">
            <Textarea
              rows={4}
              placeholder="What worked, what you'd do differently..."
              {...register("tips")}
            />
          </Field>
          <Field label="Full story (optional)">
            <Textarea
              rows={6}
              placeholder="Share the full narrative of your interview experience..."
              {...register("content")}
            />
          </Field>
          <Field label="Tags">
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <ListInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="e.g. dsa, leetcode, behavioral"
                />
              )}
            />
          </Field>
          <Controller
            control={control}
            name="isAnonymous"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Post anonymously (your profile won&apos;t be shown)
              </label>
            )}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={createPost.isPending || isSubmitting}>
          {(createPost.isPending || isSubmitting) && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {isEdit ? "Save changes" : "Publish experience"}
        </Button>
      </div>
    </form>
  );
}
