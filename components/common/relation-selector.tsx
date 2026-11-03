import { MousePointerClickIcon } from "lucide-react"
import type { ComponentProps, PropsWithChildren, ReactNode } from "react"
import { AnimatedContainer } from "~/components/common/animated-container"
import { Badge } from "~/components/common/badge"
import { Button } from "~/components/common/button"
import {
  Command,
  CommandCheckboxItem,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "~/components/common/command"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/common/popover"
import { Separator } from "~/components/common/separator"
import { Stack } from "~/components/common/stack"

interface Relation {
  id: string
  name: ReactNode
}

// The trigger takes the field's id and aria attributes, so its label and error point at it.
export interface RelationSelectorProps<T extends Relation = Relation>
  extends
    PropsWithChildren,
    Pick<
      ComponentProps<"button">,
      "id" | "aria-labelledby" | "aria-describedby" | "aria-invalid" | "aria-required"
    > {
  relations: T[]
  ids: string[]
  setIds: (ids: string[]) => void
  /** Customizes how a relation renders in the badges and the list, e.g. with a favicon. */
  mapFunction?: (relation: T) => Relation
}

export function RelationSelector<T extends Relation>({
  children,
  relations,
  ids,
  setIds,
  mapFunction,
  ...triggerProps
}: RelationSelectorProps<T>) {
  function toDisplay(relation: T) {
    return mapFunction?.(relation) ?? relation
  }
  const selectedRelations = relations.filter(({ id }) => ids.includes(id)).map(toDisplay)

  function handleFilter(value: string, search: string) {
    const normalizedValue = value.toLowerCase()
    const normalizedSearch = search.toLowerCase()
    return normalizedValue.includes(normalizedSearch) ? 1 : 0
  }

  return (
    <Stack direction="column" className="w-full">
      <Popover>
        <Button
          variant="secondary"
          size="md"
          prefix={<MousePointerClickIcon />}
          suffix={
            <Badge variant="outline" className="ml-auto size-auto">
              {selectedRelations.length}
            </Badge>
          }
          render={<PopoverTrigger />}
          className="justify-start w-full px-3 gap-2.5"
          {...triggerProps}
        >
          <Separator orientation="vertical" className="self-stretch" />

          <AnimatedContainer>
            <Stack size="xs">
              {!selectedRelations.length && (
                <span className="font-normal text-muted-foreground">Select</span>
              )}

              {selectedRelations.map(relation => (
                <Badge key={relation.id}>{relation.name}</Badge>
              ))}
            </Stack>
          </AnimatedContainer>
        </Button>

        <PopoverContent align="start" className="p-0">
          <Command filter={handleFilter}>
            <CommandInput placeholder="Search..." />

            <CommandList className="min-w-72 w-(--anchor-width)">
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {relations.map(toDisplay).map(relation => {
                  const isSelected = ids.includes(relation.id)

                  return (
                    <CommandCheckboxItem
                      key={relation.id}
                      checked={isSelected}
                      onSelect={() => {
                        setIds(
                          isSelected ? ids.filter(id => id !== relation.id) : [...ids, relation.id],
                        )
                      }}
                    >
                      <Stack wrap={false} className="flex-1 justify-between truncate">
                        {relation.name}
                      </Stack>
                    </CommandCheckboxItem>
                  )
                })}
              </CommandGroup>

              {!!ids.length && (
                <div className="p-1 border-t sticky bottom-0 bg-background">
                  <Button size="md" variant="ghost" className="w-full" onClick={() => setIds([])}>
                    Clear selection
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {children}
    </Stack>
  )
}
