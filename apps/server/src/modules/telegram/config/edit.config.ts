export const EDIT = {
  unchanged: /message is not modified/i,
  uneditable: /message can't be edited|message to edit not found|no text in the message to edit/i
} as const;
