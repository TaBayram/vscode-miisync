import { MII, RowsetsFatal } from "./responsetypes";

export function IsFatalResponse(response): response is MII<null, null, RowsetsFatal> {
    return 'FatalError' in response.Rowsets;
}