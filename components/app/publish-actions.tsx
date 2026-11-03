"use client"

import { formatDate, startOfToday } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type ComponentProps, createContext, type ReactNode, use, useState } from "react"
import { Button, type ButtonProps } from "~/components/common/button"
import { Calendar, useCalendarFocus } from "~/components/common/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/common/dialog"
import { H5, H6 } from "~/components/common/heading"
import { Input } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
import { Note } from "~/components/common/note"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/common/popover"
import { RadioGroup, RadioGroupItem } from "~/components/common/radio-group"
import { Stack } from "~/components/common/stack"

type PublishSubmitDate = "now" | "scheduled" | null

interface PublishPopoverOption<TStatus extends string> {
  status: TStatus
  title: ReactNode
  description?: ReactNode
  /**
   * If present, renders the option's submit button. The `date` field tells the
   * component what to pass as `publishedAt`:
   * - `"now"` → `new Date()` (publish immediately)
   * - `"scheduled"` → date built from the popover's date+time picker
   * - `null` → `null` (revert to draft / unschedule)
   */
  submit?: {
    label: ReactNode
    date: PublishSubmitDate
  }
}

export interface PublishActionConfig<TStatus extends string> extends Omit<ButtonProps, "popover"> {
  popover?: {
    title: ReactNode
    description?: ReactNode
    options: PublishPopoverOption<TStatus>[]
  }
}

interface PublishActionsContextValue {
  /** Status the entity is saved with. */
  status: string
  /** Status currently selected in the popover. */
  currentStatus: string
}

const PublishActionsContext = createContext<PublishActionsContextValue | null>(null)

/** Reads the saved and selected status from inside the `PublishActions` popover. */
export function usePublishActions() {
  const context = use(PublishActionsContext)

  if (!context) {
    throw new Error("usePublishActions must be used within PublishActions")
  }

  return context
}

function resolveInitialDate(publishedAt?: Date | null) {
  const date = publishedAt ? new Date(publishedAt) : null
  return date && !Number.isNaN(date.getTime()) ? date : new Date()
}

function resolvePublishDate(date: PublishSubmitDate, selectedDate: Date, selectedTime: string) {
  if (date === "now") {
    return new Date()
  }

  if (date === "scheduled") {
    const [hours, minutes] = selectedTime.split(":").map(Number)
    const scheduledDate = new Date(selectedDate)
    scheduledDate.setHours(hours, minutes, 0, 0)
    return scheduledDate
  }

  return null
}

interface PublishActionsProps<TStatus extends string> extends ComponentProps<typeof Stack> {
  status: TStatus
  publishedAt?: Date | null
  isPending: boolean
  isStatusPending: boolean
  /** Disables every save and status action, e.g. for roles that can't write. */
  isDisabled?: boolean
  scheduledStatus: TStatus
  actions: Record<TStatus, PublishActionConfig<TStatus>[]>
  onStatusSubmit: (status: TStatus, publishedAt: Date | null) => void
}

/**
 * Status buttons and the publish popover. Children render inside the popover,
 * below the options. Key the component on `status` so the selection resets
 * after a transition.
 */
export function PublishActions<TStatus extends string>({
  status,
  publishedAt,
  isPending,
  isStatusPending,
  isDisabled,
  scheduledStatus,
  actions,
  onStatusSubmit,
  children,
  ...props
}: PublishActionsProps<TStatus>) {
  const popoverOptions = actions[status].find(action => action.popover)?.popover?.options ?? []
  const initialStatus =
    popoverOptions.find(option => option.status === status)?.status ??
    popoverOptions[0]?.status ??
    status

  const [isOpen, setIsOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<TStatus>(initialStatus)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => resolveInitialDate(publishedAt))
  const [selectedTime, setSelectedTime] = useState(() => formatDate(selectedDate, "HH:mm"))
  const [today] = useState(startOfToday)
  const { ref: calendarRef, initialFocus } = useCalendarFocus()

  function handleSubmit(option: PublishPopoverOption<TStatus>) {
    if (!option.submit) {
      return
    }

    onStatusSubmit(
      option.status,
      resolvePublishDate(option.submit.date, selectedDate, selectedTime),
    )
    setIsOpen(false)
  }

  return (
    <Stack size="sm" {...props}>
      {actions[status].map(({ popover, ...action }) => {
        if (popover) {
          const currentOption =
            popover.options.find(option => option.status === currentStatus) ?? popover.options[0]

          return (
            <Popover key={String(action.children)} open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger
                render={
                  <Button size="md" isPending={isStatusPending} disabled={isDisabled} {...action} />
                }
              />

              <PopoverContent
                align="center"
                side="top"
                sideOffset={8}
                className="flex flex-col items-stretch gap-5 min-w-80"
              >
                <Stack size="sm" direction="column">
                  <H5>{popover.title}</H5>

                  {popover.description && <Note>{popover.description}</Note>}
                </Stack>

                <RadioGroup
                  value={currentStatus}
                  className="contents"
                  onValueChange={value => setCurrentStatus(value as TStatus)}
                >
                  {popover.options.map(({ status, title, description }) => (
                    <Stack key={status} size="sm" className="items-start">
                      <RadioGroupItem id={status} value={status} />

                      <Stack
                        size="sm"
                        direction="column"
                        render={<label htmlFor={status} aria-label={String(title)} />}
                        className="flex-1"
                      >
                        <H6>{title}</H6>

                        {description && <Note>{description}</Note>}

                        {status === scheduledStatus && currentStatus === scheduledStatus && (
                          <Stack size="sm" wrap={false} className="mt-2 items-stretch w-full">
                            <Button
                              size="md"
                              variant="secondary"
                              suffix={<CalendarIcon />}
                              className="w-full tabular-nums"
                              onClick={() => setIsScheduleOpen(true)}
                            >
                              {formatDate(selectedDate, "yyyy-MM-dd")}
                            </Button>

                            <Input
                              type="time"
                              value={selectedTime}
                              className="w-full tabular-nums"
                              onChange={event => setSelectedTime(event.target.value)}
                            />

                            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                              <DialogContent
                                ref={calendarRef}
                                initialFocus={initialFocus}
                                size="sm"
                              >
                                <DialogHeader>
                                  <DialogTitle>Pick a date to publish</DialogTitle>
                                </DialogHeader>

                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  defaultMonth={selectedDate}
                                  disabled={{ before: today }}
                                  onSelect={date => {
                                    if (date) {
                                      setSelectedDate(date)
                                    }
                                    setIsScheduleOpen(false)
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  ))}
                </RadioGroup>

                <PublishActionsContext value={{ status, currentStatus }}>
                  {children}
                </PublishActionsContext>

                <Stack className="justify-between">
                  <Button size="md" variant="secondary" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>

                  {currentOption.submit && (
                    <Button
                      size="md"
                      isPending={isStatusPending}
                      onClick={() => handleSubmit(currentOption)}
                    >
                      {currentOption.submit.label}
                    </Button>
                  )}
                </Stack>
              </PopoverContent>
            </Popover>
          )
        }

        return (
          <Button
            key={String(action.children)}
            type="submit"
            size="md"
            isPending={isPending}
            disabled={isDisabled}
            suffix={<Kbd variant="outline" keys={["mod", "enter"]} />}
            className="lg:min-w-24"
            {...action}
          />
        )
      })}
    </Stack>
  )
}
