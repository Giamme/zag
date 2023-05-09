import { createMachine, guards } from "@zag-js/core"
import { contains, raf } from "@zag-js/dom-query"
import { trackInteractOutside } from "@zag-js/interact-outside"
import { compact } from "@zag-js/utils"
import { dom } from "./editable.dom"
import type { MachineContext, MachineState, UserDefinedContext } from "./editable.types"

const { not } = guards

export function machine(userContext: UserDefinedContext) {
  const ctx = compact(userContext)
  return createMachine<MachineContext, MachineState>(
    {
      id: "editable",
      initial: ctx.startWithEditView ? "edit" : "preview",
      context: {
        activationMode: "focus",
        submitMode: "both",
        value: "",
        previousValue: "",
        selectOnFocus: true,
        ...ctx,
        translations: {
          input: "editable input",
          edit: "edit",
          submit: "submit",
          cancel: "cancel",
          ...ctx.translations,
        },
      },

      watch: {
        value: ["invokeOnChange", "syncInputValue"],
      },

      computed: {
        submitOnEnter: (ctx) => ["both", "enter"].includes(ctx.submitMode),
        submitOnBlur: (ctx) => ["both", "blur"].includes(ctx.submitMode),
        isInteractive: (ctx) => !(ctx.disabled || ctx.readOnly),
        isValueEmpty: (ctx) => ctx.value === "",
        isPreviewFocusable: (ctx) => ctx.activationMode === "focus",
      },

      on: {
        SET_VALUE: {
          actions: "setValue",
        },
      },

      states: {
        preview: {
          // // https://bugzilla.mozilla.org/show_bug.cgi?id=559561
          entry: ["blurInputIfNeeded"],
          on: {
            EDIT: {
              target: "edit",
              actions: ["focusInput", "invokeOnEdit"],
            },
            DBLCLICK: {
              guard: "activateOnDblClick",
              target: "edit",
              actions: ["focusInput", "invokeOnEdit"],
            },
            FOCUS: {
              guard: "activateOnFocus",
              target: "edit",
              actions: ["setPreviousValue", "focusInput", "invokeOnEdit"],
            },
          },
        },

        edit: {
          activities: ["trackInteractOutside"],
          on: {
            TYPE: {
              guard: not("isAtMaxLength"),
              actions: "setValue",
            },
            BLUR: [
              {
                guard: "submitOnBlur",
                target: "preview",
                actions: ["restoreFocusIfNeeded", "invokeOnSubmit"],
              },
              {
                target: "preview",
                actions: ["resetValueIfNeeded", "restoreFocusIfNeeded", "invokeOnCancel"],
              },
            ],
            CANCEL: {
              target: "preview",
              actions: ["restoreFocusIfNeeded", "resetValueIfNeeded", "invokeOnCancel"],
            },
            ENTER: {
              guard: "submitOnEnter",
              target: "preview",
              actions: ["setPreviousValue", "invokeOnSubmit", "restoreFocusIfNeeded"],
            },
            SUBMIT: {
              target: "preview",
              actions: ["setPreviousValue", "invokeOnSubmit", "restoreFocusIfNeeded"],
            },
          },
        },
      },
    },
    {
      guards: {
        submitOnBlur: (ctx) => ctx.submitOnBlur,
        submitOnEnter: (ctx) => ctx.submitOnEnter,
        isAtMaxLength: (ctx) => ctx.maxLength != null && ctx.value.length === ctx.maxLength,
        activateOnDblClick: (ctx) => ctx.activationMode === "dblclick",
        activateOnFocus: (ctx) => ctx.activationMode === "focus",
      },

      activities: {
        trackInteractOutside(ctx, _evt, { send }) {
          return trackInteractOutside(dom.getInputEl(ctx), {
            exclude(target) {
              const ignore = [dom.getCancelTriggerEl(ctx), dom.getSubmitTriggerEl(ctx)]
              return ignore.some((el) => contains(el, target))
            },
            onInteractOutside(event) {
              ctx.onInteractOutside?.(event)
              if (event.defaultPrevented) return
              const { focusable } = event.detail
              send({ type: "BLUR", src: "interact-outside", focusable })
            },
          })
        },
      },

      actions: {
        restoreFocusIfNeeded(ctx, evt) {
          if (evt.focusable) return
          raf(() => {
            const finalEl = ctx.finalFocusEl?.() ?? dom.getEditTriggerEl(ctx)
            finalEl?.focus({ preventScroll: true })
          })
        },
        focusInput(ctx) {
          raf(() => {
            const input = dom.getInputEl(ctx)
            if (!input) return

            if (ctx.selectOnFocus) {
              input.select()
            } else {
              input.focus({ preventScroll: true })
            }
          })
        },
        invokeOnCancel(ctx) {
          ctx.onCancel?.({ value: ctx.previousValue })
        },
        invokeOnSubmit(ctx) {
          ctx.onSubmit?.({ value: ctx.value })
        },
        invokeOnEdit(ctx) {
          ctx.onEdit?.()
        },
        invokeOnChange(ctx) {
          ctx.onChange?.({ value: ctx.value })
        },
        syncInputValue(ctx) {
          const input = dom.getInputEl(ctx)
          if (!input) return
          input.value = ctx.value
        },
        setValue(ctx, evt) {
          ctx.value = evt.value
        },
        setPreviousValue(ctx) {
          ctx.previousValue = ctx.value
        },
        resetValueIfNeeded(ctx) {
          if (!ctx.previousValue) return
          ctx.value = ctx.previousValue
        },
        blurInputIfNeeded(ctx) {
          dom.getInputEl(ctx)?.blur()
        },
      },
    },
  )
}
