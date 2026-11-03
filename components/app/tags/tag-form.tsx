"use client"

import { slugify } from "@dirstack/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { createId } from "@paralleldrive/cuid2"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { type ComponentProps, useMemo } from "react"
import { FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import type { Tag } from "~/.generated/prisma/browser"
import { EntityFormFooter, EntityFormHeader, EntityFormSubmit } from "~/components/app/entity-form"
import { TagActions } from "~/components/app/tags/tag-actions"
import { FormField } from "~/components/common/field"
import { Input } from "~/components/common/input"
import { RelationSelector } from "~/components/common/relation-selector"
import { useCan } from "~/contexts/user-context"
import { useComputedField } from "~/hooks/use-computed-field"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findTagById } from "~/server/tags/queries"
import { tagCreateSchema } from "~/server/tags/schema"

interface TagFormProps extends ComponentProps<"form"> {
  tag?: NonNullable<Awaited<ReturnType<typeof findTagById>>>
}

export function TagForm({ className, title, tag, ...props }: TagFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: tools = [] } = useQuery(orpc.tools.lookup.queryOptions())
  const canSave = useCan(tag ? "tags.update" : "tags.create")

  const id = useMemo(() => tag?.id ?? createId(), [tag?.id])

  const form = useForm({
    resolver: zodResolver(tagCreateSchema),
    values: {
      name: tag?.name ?? "",
      slug: tag?.slug ?? "",
      tools: tag?.tools.map(tool => tool.id) ?? [],
    },
  })

  const mutationOptions = {
    onSuccess: (data: Tag) => {
      toast.success(`Tag successfully ${tag ? "updated" : "created"}`)
      queryClient.invalidateQueries({ queryKey: orpc.tags.key() })
      router.push(`/app/tags/${data.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  }

  const createMutation = useMutation(orpc.tags.create.mutationOptions(mutationOptions))
  const updateMutation = useMutation(orpc.tags.update.mutationOptions(mutationOptions))
  const mutation = tag ? updateMutation : createMutation

  const onSubmit = form.handleSubmit(data => mutation.mutate({ id, ...data }))

  useHotkeys([["mod+enter", () => canSave && onSubmit()]], [], true)

  useComputedField({
    form,
    sourceField: "name",
    computedField: "slug",
    callback: slugify,
    enabled: !tag,
  })

  return (
    <Form {...form}>
      <EntityFormHeader title={title}>{tag && <TagActions tag={tag} size="md" />}</EntityFormHeader>

      <form
        noValidate
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        onSubmit={onSubmit}
        {...props}
      >
        <FormField control={form.control} name="name" label="Name" required>
          <Input />
        </FormField>

        <FormField control={form.control} name="slug" label="Slug">
          <Input />
        </FormField>

        <FormField control={form.control} name="tools" label="Tools" className="col-span-full">
          {({ field, controlProps }) => (
            <RelationSelector
              {...controlProps}
              relations={tools}
              ids={field.value ?? []}
              setIds={field.onChange}
            />
          )}
        </FormField>

        <EntityFormFooter cancelHref="/app/tags">
          <EntityFormSubmit isPending={mutation.isPending} disabled={!canSave}>
            {tag ? "Update tag" : "Create tag"}
          </EntityFormSubmit>
        </EntityFormFooter>
      </form>
    </Form>
  )
}
