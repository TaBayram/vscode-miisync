export type GroupIdentifier = number;

export interface IEditorCommandsContext {
	groupId: GroupIdentifier;
	editorIndex?: number;

	preserveFocus?: boolean;
}