import { MII, RowsetsFatal } from "./responsetypes";

export function IsFatalResponse(response): response is MII<null, null, RowsetsFatal> {
    return response && 'FatalError' in response.Rowsets;
}