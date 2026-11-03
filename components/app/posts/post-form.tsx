"use client"

import { formatDateTime, isValidImageSrc, slugify } from "@dirstack/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { createId } from "@paralleldrive/cuid2"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Editor } from "@tiptap/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { type ComponentProps, useCallback, useMemo } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { type Post, PostStatus } from "~/.generated/prisma/browser"
import { EntityFormFooter, EntityFormHeader } from "~/components/app/entity-form"
import { PostActions } from "~/components/app/posts/post-actions"
import { PublishActions } from "~/components/app/publish-actions"
import { PublishStatusNote } from "~/components/app/publish-status-note"
import { TiptapEditor } from "~/components/app/tiptap/tiptap-editor"
import { usePublishSubmit } from "~/components/app/use-publish-submit"
import { FormField } from "~/components/common/field"
import { FormMedia } from "~/components/common/form-media"
import { Input } from "~/components/common/input"
import { Note } from "~/components/common/note"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/common/select"
import { TextArea } from "~/components/common/textarea"
import { postAdminActions } from "~/config/post-statuses"
import { useCan, useUser } from "~/contexts/user-context"
import { useComputedField } from "~/hooks/use-computed-field"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findPostById } from "~/server/posts/queries"
import { postCreateSchema } from "~/server/posts/schema"

interface PostFormProps extends ComponentProps<"form"> {
  post?: NonNullable<Awaited<ReturnType<typeof findPostById>>>
}

export function PostForm({ className, title, post, ...props }: PostFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const canReadUsers = useCan("users.read")
  const canSave = useCan(post ? "posts.update" : "posts.create")

  const user = useUser()

  // Without `users.read` the author list falls back to the post's own author,
  // or to the current user for a new post (the default author).
  const fallbackAuthor = post?.author ?? (user && { id: user.id, name: user.name })
  const { data: users = fallbackAuthor ? [fallbackAuthor] : [] } = useQuery(
    orpc.users.lookup.queryOptions({ enabled: canReadUsers }),
  )
  const status = post?.status ?? PostStatus.Draft
  const id = useMemo(() => post?.id ?? createId(), [post?.id])

  const form = useForm({
    resolver: zodResolver(postCreateSchema),
    values: {
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      description: post?.description ?? "",
      content: post?.content ?? "",
      plainText: post?.plainText ?? "",
      imageUrl: post?.imageUrl ?? "",
      status,
      publishedAt: post?.publishedAt ?? undefined,
      authorId: post?.authorId ?? user?.id ?? "",
    },
  })

  const mutationOptions = {
    onSuccess: (data: Post) => {
      if (data.status !== status) {
        toast.success(
          <>
            Post is now {data.status.toLowerCase()}.{" "}
            {data.status === PostStatus.Scheduled && data.publishedAt && (
              <>Will be published on {formatDateTime(data.publishedAt, { dateStyle: "long" })}.</>
            )}
          </>,
        )
      } else {
        toast.success(`Post successfully ${post ? "updated" : "created"}`)
      }

      queryClient.invalidateQueries({ queryKey: orpc.posts.key() })
      router.push(`/app/posts/${data.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  }

  const createMutation = useMutation(orpc.posts.create.mutationOptions(mutationOptions))
  const updateMutation = useMutation(orpc.posts.update.mutationOptions(mutationOptions))
  const mutation = post ? updateMutation : createMutation

  const { onSubmit, handleStatusSubmit, isPending, isStatusPending } = usePublishSubmit({
    form,
    onValid: data => mutation.mutate({ id, ...data }),
    isPending: mutation.isPending,
  })

  useHotkeys([["mod+enter", () => canSave && onSubmit()]], [], true)

  useComputedField({
    form,
    sourceField: "title",
    computedField: "slug",
    callback: slugify,
    enabled: !post,
  })

  const path = `posts/${id}`

  const handleEditorUpdate = useCallback(
    (editor: Editor) => {
      form.setValue("content", editor.getMarkdown())
      form.setValue("plainText", editor.getText())
    },
    [form],
  )

  return (
    <Form {...form}>
      <EntityFormHeader
        title={title}
        note={
          post && (
            <PublishStatusNote
              href={`/blog/${post.slug}`}
              status={post.status}
              publishedAt={post.publishedAt}
            />
          )
        }
      >
        {post && <PostActions post={post} size="md" />}
      </EntityFormHeader>

      <form
        noValidate
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        onSubmit={onSubmit}
        {...props}
      >
        <FormField control={form.control} name="title" label="Title" required>
          <Input data-1p-ignore />
        </FormField>

        <FormField control={form.control} name="slug" label="Slug">
          <Input />
        </FormField>

        <FormField
          control={form.control}
          name="description"
          label="Description"
          labelSuffix={<Note className="text-xs">Max. 160 chars</Note>}
          className="col-span-full"
        >
          <TextArea />
        </FormField>

        <FormField control={form.control} name="authorId" label="Author" required>
          {({ field, controlProps }) => (
            <Select
              value={field.value}
              items={users.map(user => ({ value: user.id, label: user.name }))}
              onValueChange={field.onChange}
            >
              <SelectTrigger {...controlProps}>
                <SelectValue placeholder="Select author" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <Controller
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormMedia form={form} field={field} path={`${path}/image`}>
              {isValidImageSrc(field.value) && (
                <Image
                  src={field.value}
                  alt="Featured image"
                  height={72}
                  width={128}
                  className="h-8 w-auto border box-content rounded-md aspect-video object-cover"
                />
              )}
            </FormMedia>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          label="Content"
          required
          className="col-span-full items-stretch"
        >
          {({ field, controlProps }) => (
            <TiptapEditor
              value={field.value}
              mediaPath={path}
              controlProps={controlProps}
              onUpdate={handleEditorUpdate}
            />
          )}
        </FormField>

        <EntityFormFooter cancelHref="/app/posts">
          <PublishActions
            key={status}
            status={status}
            publishedAt={post?.publishedAt}
            scheduledStatus={PostStatus.Scheduled}
            actions={postAdminActions}
            isPending={isPending}
            isStatusPending={isStatusPending}
            isDisabled={!canSave}
            onStatusSubmit={handleStatusSubmit}
          />
        </EntityFormFooter>
      </form>
    </Form>
  )
}
