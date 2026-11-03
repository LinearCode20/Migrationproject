"use client"

import { formatDateTime, isValidImageSrc, slugify } from "@dirstack/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { createId } from "@paralleldrive/cuid2"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { EyeIcon, InfoIcon, PencilIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type ComponentProps, useMemo, useState } from "react"
import { Controller, FormProvider as Form, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { type Tool, ToolStatus, ToolTier } from "~/.generated/prisma/browser"
import { AIGenerateContent } from "~/components/app/ai/generate-content"
import { AIRelationSuggestions } from "~/components/app/ai/relation-suggestions"
import { EntityFormFooter, EntityFormHeader } from "~/components/app/entity-form"
import { PublishActions } from "~/components/app/publish-actions"
import { PublishStatusNote } from "~/components/app/publish-status-note"
import { NotifyOwnerField } from "~/components/app/tools/notify-owner-field"
import { ToolActions } from "~/components/app/tools/tool-actions"
import { ToolOwnerField } from "~/components/app/tools/tool-owner-field"
import { usePublishSubmit } from "~/components/app/use-publish-submit"
import { Button } from "~/components/common/button"
import { FormField } from "~/components/common/field"
import { FormMedia } from "~/components/common/form-media"
import { Input, inputVariants } from "~/components/common/input"
import { Note } from "~/components/common/note"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/common/select"
import { TextArea } from "~/components/common/textarea"
import { Tooltip } from "~/components/common/tooltip"
import { Markdown } from "~/components/web/markdown"
import { toolAdminActions } from "~/config/tool-statuses"
import { useCan } from "~/contexts/user-context"
import { useComputedField } from "~/hooks/use-computed-field"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findToolById } from "~/server/tools/queries"
import { toolCreateSchema } from "~/server/tools/schema"

interface ToolStatusChangeProps {
  tool: Tool
}

function ToolStatusChange({ tool }: ToolStatusChangeProps) {
  return (
    <>
      <Link href={`/${tool.slug}`} target="_blank" className="font-semibold underline inline-block">
        {tool.name}
      </Link>{" "}
      is now {tool.status.toLowerCase()}.{" "}
      {tool.status === ToolStatus.Scheduled && tool.publishedAt && (
        <>
          Will be published on {formatDateTime(tool.publishedAt, { dateStyle: "long" })} (
          {Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/^.+\//, "")}).
        </>
      )}
    </>
  )
}

interface ToolFormProps extends ComponentProps<"form"> {
  tool?: NonNullable<Awaited<ReturnType<typeof findToolById>>>
}

export function ToolForm({ className, title, tool, ...props }: ToolFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: categories = [] } = useQuery(orpc.categories.lookup.queryOptions())
  const { data: tags = [] } = useQuery(orpc.tags.lookup.queryOptions())
  const canSave = useCan(tool ? "tools.update" : "tools.create")
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isGenerationComplete, setIsGenerationComplete] = useState(true)
  const status = tool?.status ?? ToolStatus.Draft

  const id = useMemo(() => tool?.id ?? createId(), [tool?.id])

  const form = useForm({
    resolver: zodResolver(toolCreateSchema),
    values: {
      name: tool?.name ?? "",
      slug: tool?.slug ?? "",
      tagline: tool?.tagline ?? "",
      description: tool?.description ?? "",
      content: tool?.content ?? "",
      websiteUrl: tool?.websiteUrl ?? "",
      affiliateUrl: tool?.affiliateUrl ?? "",
      faviconUrl: tool?.faviconUrl ?? "",
      screenshotUrl: tool?.screenshotUrl ?? "",
      tier: tool?.tier ?? ToolTier.Free,
      submitterNote: tool?.submitterNote ?? "",
      status,
      publishedAt: tool?.publishedAt ?? undefined,
      categories: tool?.categories.map(category => category.id) ?? [],
      tags: tool?.tags.map(tag => tag.id) ?? [],
      notifyOwner: true,
    },
  })

  const mutationOptions = {
    onSuccess: (data: Tool) => {
      if (data.status !== status) {
        toast.success(<ToolStatusChange tool={data} />)
      } else {
        toast.success(`Tool successfully ${tool ? "updated" : "created"}`)
      }

      queryClient.invalidateQueries({ queryKey: orpc.tools.key() })
      router.push(`/app/tools/${data.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  }

  const createMutation = useMutation(orpc.tools.create.mutationOptions(mutationOptions))
  const updateMutation = useMutation(orpc.tools.update.mutationOptions(mutationOptions))
  const mutation = tool ? updateMutation : createMutation

  const { onSubmit, handleStatusSubmit, isPending, isStatusPending } = usePublishSubmit({
    form,
    onValid: data => mutation.mutate({ id, ...data }),
    isPending: mutation.isPending,
  })

  useHotkeys([["mod+enter", () => canSave && onSubmit()]], [], true)

  useComputedField({
    form,
    sourceField: "name",
    computedField: "slug",
    callback: slugify,
    enabled: !tool,
  })

  const [name, websiteUrl, description, content] = useWatch({
    control: form.control,
    name: ["name", "websiteUrl", "description", "content"],
  })

  const path = `tools/${id}`

  return (
    <Form {...form}>
      <EntityFormHeader
        title={title}
        note={
          tool && (
            <PublishStatusNote
              href={`/${tool.slug}`}
              status={tool.status}
              publishedAt={tool.publishedAt}
            />
          )
        }
      >
        <AIGenerateContent
          url={websiteUrl}
          onGenerate={() => setIsGenerationComplete(false)}
          onFinish={() => setIsGenerationComplete(true)}
          onComplete={object => {
            form.setValue("tagline", object.tagline)
            form.setValue("description", object.description)
            form.setValue("content", object.content)
          }}
        />

        {tool && <ToolActions tool={tool} size="md" />}
      </EntityFormHeader>

      <form
        noValidate
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        onSubmit={onSubmit}
        {...props}
      >
        <FormField control={form.control} name="name" label="Name" required>
          <Input data-1p-ignore />
        </FormField>

        <FormField control={form.control} name="slug" label="Slug">
          <Input />
        </FormField>

        <FormField control={form.control} name="websiteUrl" label="Website URL" required>
          <Input type="url" />
        </FormField>

        <FormField
          control={form.control}
          name="affiliateUrl"
          label="Affiliate URL"
          labelSuffix={
            <Tooltip tooltip="If you have an affiliate link, you can enter it here. This will be displayed on the tool page.">
              <InfoIcon className="cursor-help opacity-50" />
            </Tooltip>
          }
        >
          <Input type="url" />
        </FormField>

        <FormField
          control={form.control}
          name="tagline"
          label="Tagline"
          labelSuffix={<Note className="text-xs">Max. 60 chars</Note>}
          className="col-span-full"
        >
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

        <FormField
          control={form.control}
          name="content"
          label="Content"
          labelSuffix={
            content && (
              <Button
                size="sm"
                variant="secondary"
                prefix={isPreviewing ? <PencilIcon /> : <EyeIcon />}
                className="-my-1"
                onClick={() => setIsPreviewing(previous => !previous)}
              >
                {isPreviewing ? "Edit" : "Preview"}
              </Button>
            )
          }
          className="col-span-full items-stretch"
        >
          {({ field, controlProps }) =>
            field.value && isPreviewing ? (
              <Markdown
                code={field.value}
                className={cx(inputVariants(), "max-w-none min-h-18 bg-card leading-normal")}
              />
            ) : (
              <TextArea {...controlProps} {...field} className="min-h-48" />
            )
          }
        </FormField>

        {tool?.owner && (
          <>
            <ToolOwnerField
              owner={tool.owner}
              verifiedAt={tool.verifiedAt}
              className="col-span-full"
            />

            <FormField
              control={form.control}
              name="submitterNote"
              label="Submitter Note"
              className="col-span-full"
            >
              <Input />
            </FormField>
          </>
        )}

        <Controller
          control={form.control}
          name="faviconUrl"
          render={({ field }) => (
            <FormMedia
              form={form}
              field={field}
              path={`${path}/favicon`}
              fetchType="favicon"
              websiteUrl={websiteUrl}
            >
              {isValidImageSrc(field.value) && (
                <Image
                  src={field.value}
                  alt="Favicon"
                  width={32}
                  height={32}
                  className="size-8 border box-content rounded-md object-contain"
                />
              )}
            </FormMedia>
          )}
        />

        <Controller
          control={form.control}
          name="screenshotUrl"
          render={({ field }) => (
            <FormMedia
              form={form}
              field={field}
              path={`${path}/screenshot`}
              fetchType="screenshot"
              websiteUrl={websiteUrl}
            >
              {isValidImageSrc(field.value) && (
                <Image
                  src={field.value}
                  alt="Screenshot"
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
          name="categories"
          label="Categories"
          className="col-span-full"
        >
          {({ field, controlProps }) => (
            <AIRelationSuggestions
              {...controlProps}
              relations={categories}
              ids={field.value ?? []}
              setIds={field.onChange}
              prompt={
                isGenerationComplete && name && description
                  ? `From the list of available categories below, suggest relevant categories for this link:

                    - URL: ${websiteUrl}
                    - Meta title: ${name}
                    - Meta description: ${description}.`
                  : undefined
              }
            />
          )}
        </FormField>

        <FormField control={form.control} name="tags" label="Tags" className="col-span-full">
          {({ field, controlProps }) => (
            <AIRelationSuggestions
              {...controlProps}
              relations={tags}
              ids={field.value ?? []}
              setIds={field.onChange}
              maxSuggestions={10}
              prompt={
                isGenerationComplete && name && description
                  ? `From the list of available tags below, suggest relevant tags for this link:

                    - URL: ${websiteUrl}
                    - Meta title: ${name}
                    - Meta description: ${description}.`
                  : undefined
              }
            />
          )}
        </FormField>

        <FormField control={form.control} name="tier" label="Tier" className="col-span-full">
          {({ field, controlProps }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger {...controlProps}>
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ToolTier).map(tier => (
                  <SelectItem key={tier} value={tier}>
                    {tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <EntityFormFooter cancelHref="/app/tools">
          <PublishActions
            key={status}
            status={status}
            publishedAt={tool?.publishedAt}
            scheduledStatus={ToolStatus.Scheduled}
            actions={toolAdminActions}
            isPending={isPending}
            isStatusPending={isStatusPending}
            isDisabled={!canSave}
            onStatusSubmit={handleStatusSubmit}
          >
            {tool?.owner && <NotifyOwnerField />}
          </PublishActions>
        </EntityFormFooter>
      </form>
    </Form>
  )
}
