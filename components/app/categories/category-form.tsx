"use client"

import { slugify } from "@dirstack/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { createId } from "@paralleldrive/cuid2"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { type ComponentProps, useMemo } from "react"
import { FormProvider as Form, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import type { Category } from "~/.generated/prisma/browser"
import { AIGenerateDescription } from "~/components/app/ai/generate-description"
import { CategoryActions } from "~/components/app/categories/category-actions"
import { EntityFormFooter, EntityFormHeader, EntityFormSubmit } from "~/components/app/entity-form"
import { FormField } from "~/components/common/field"
import { Input } from "~/components/common/input"
import { RelationSelector } from "~/components/common/relation-selector"
import { TextArea } from "~/components/common/textarea"
import { useCan } from "~/contexts/user-context"
import { useComputedField } from "~/hooks/use-computed-field"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findCategoryById } from "~/server/categories/queries"
import { categoryCreateSchema } from "~/server/categories/schema"

interface CategoryFormProps extends ComponentProps<"form"> {
  category?: NonNullable<Awaited<ReturnType<typeof findCategoryById>>>
}

export function CategoryForm({ className, title, category, ...props }: CategoryFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: tools = [] } = useQuery(orpc.tools.lookup.queryOptions())
  const canSave = useCan(category ? "categories.update" : "categories.create")

  const id = useMemo(() => category?.id ?? createId(), [category?.id])

  const form = useForm({
    resolver: zodResolver(categoryCreateSchema),
    values: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      label: category?.label ?? "",
      description: category?.description ?? "",
      tools: category?.tools.map(tool => tool.id) ?? [],
    },
  })

  const mutationOptions = {
    onSuccess: (data: Category) => {
      toast.success(`Category successfully ${category ? "updated" : "created"}`)
      queryClient.invalidateQueries({ queryKey: orpc.categories.key() })
      router.push(`/app/categories/${data.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  }

  const createMutation = useMutation(orpc.categories.create.mutationOptions(mutationOptions))
  const updateMutation = useMutation(orpc.categories.update.mutationOptions(mutationOptions))
  const mutation = category ? updateMutation : createMutation

  const onSubmit = form.handleSubmit(data => mutation.mutate({ id, ...data }))

  useHotkeys([["mod+enter", () => canSave && onSubmit()]], [], true)

  const name = useWatch({ control: form.control, name: "name" })

  useComputedField({
    form,
    sourceField: "name",
    computedField: "slug",
    callback: slugify,
    enabled: !category,
  })

  useComputedField({
    form,
    sourceField: "name",
    computedField: "label",
    callback: name => name && `${name} Tools`,
    enabled: !category,
  })

  return (
    <Form {...form}>
      <EntityFormHeader title={title}>
        <AIGenerateDescription
          prompt={`Create a compelling description for the category named "${name}". Begin with a plural noun phrase (e.g., "Tools for..." or "Resources that..."). Craft a single, concise sentence that clearly conveys the purpose and value of this category. Ensure the description is specific enough to differentiate this category from others while remaining broad enough to encompass all relevant items within it.`}
          disabledReason={!form.formState.isValid && "Fill in the required fields first"}
          onComplete={object => form.setValue("description", object.description)}
        />

        {category && <CategoryActions category={category} size="md" />}
      </EntityFormHeader>

      <form
        noValidate
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        onSubmit={onSubmit}
        {...props}
      >
        <div className="grid gap-4 @lg:grid-cols-2">
          <FormField control={form.control} name="name" label="Name" required>
            <Input data-1p-ignore />
          </FormField>

          <FormField control={form.control} name="slug" label="Slug">
            <Input />
          </FormField>
        </div>

        <FormField control={form.control} name="label" label="Label">
          <Input />
        </FormField>

        <FormField
          control={form.control}
          name="description"
          label="Description"
          className="col-span-full"
        >
          <TextArea />
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

        <EntityFormFooter cancelHref="/app/categories">
          <EntityFormSubmit isPending={mutation.isPending} disabled={!canSave}>
            {category ? "Update category" : "Create category"}
          </EntityFormSubmit>
        </EntityFormFooter>
      </form>
    </Form>
  )
}
