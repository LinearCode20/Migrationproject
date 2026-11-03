"use client"

import { isValidImageSrc } from "@dirstack/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useHotkeys } from "@mantine/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ComponentProps } from "react"
import { Controller, FormProvider as Form, useForm } from "react-hook-form"
import { toast } from "sonner"
import { EntityFormFooter, EntityFormHeader, EntityFormSubmit } from "~/components/app/entity-form"
import { UserActions } from "~/components/app/users/user-actions"
import { Avatar, AvatarImage } from "~/components/common/avatar"
import { FormField } from "~/components/common/field"
import { FormMedia } from "~/components/common/form-media"
import { Input } from "~/components/common/input"
import { useCan } from "~/contexts/user-context"
import { orpc } from "~/lib/orpc-query"
import { cx } from "~/lib/utils"
import type { findUserById } from "~/server/users/queries"
import { userUpdateSchema } from "~/server/users/schema"

interface UserFormProps extends ComponentProps<"form"> {
  user: NonNullable<Awaited<ReturnType<typeof findUserById>>>
}

export function UserForm({ className, title, user, ...props }: UserFormProps) {
  const queryClient = useQueryClient()
  const canSave = useCan("users.update")

  const form = useForm({
    resolver: zodResolver(userUpdateSchema),
    values: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? "",
    },
  })

  const mutation = useMutation(
    orpc.users.update.mutationOptions({
      onSuccess: () => {
        toast.success("User successfully updated")
        queryClient.invalidateQueries({ queryKey: orpc.users.key() })
      },
      onError: error => {
        toast.error(error.message)
      },
    }),
  )

  const onSubmit = form.handleSubmit(data => mutation.mutate(data))

  useHotkeys([["mod+enter", () => canSave && onSubmit()]], [], true)

  return (
    <Form {...form}>
      <EntityFormHeader title={title}>
        <UserActions user={user} size="md" />
      </EntityFormHeader>

      <form
        noValidate
        className={cx("grid gap-4 @lg:grid-cols-2", className)}
        onSubmit={onSubmit}
        {...props}
      >
        <div className="grid gap-4 @lg:grid-cols-2">
          <FormField control={form.control} name="name" label="Name">
            <Input data-1p-ignore />
          </FormField>

          <FormField control={form.control} name="email" label="Email">
            <Input />
          </FormField>
        </div>

        <Controller
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormMedia form={form} field={field} path={`users/${user.id}/avatar`}>
              {isValidImageSrc(field.value) && (
                <Avatar className="size-8 border box-content">
                  <AvatarImage src={field.value} />
                </Avatar>
              )}
            </FormMedia>
          )}
        />

        <EntityFormFooter cancelHref="/app/users">
          <EntityFormSubmit isPending={mutation.isPending} disabled={!canSave}>
            Update user
          </EntityFormSubmit>
        </EntityFormFooter>
      </form>
    </Form>
  )
}
