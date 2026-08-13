import {
  forwardedParameterNames,
  triggerParameterNames,
  type ForwardedParameterName,
  type TrackingParameters,
} from "./types";

const CLICK_ID_MAX_LENGTH = 512;
const OTHER_VALUE_MAX_LENGTH = 256;
const TOTAL_VALUE_MAX_LENGTH = 2048;
const controlCharacterPattern = /[\u0000-\u001f\u007f]/;

function valueLimit(name: ForwardedParameterName) {
  return triggerParameterNames.includes(
    name as (typeof triggerParameterNames)[number],
  )
    ? CLICK_ID_MAX_LENGTH
    : OTHER_VALUE_MAX_LENGTH;
}

function isValidValue(name: ForwardedParameterName, value: string) {
  return (
    value.trim().length > 0 &&
    Buffer.byteLength(value, "utf8") <= valueLimit(name) &&
    !controlCharacterPattern.test(value)
  );
}

export function extractTrackingParameters(
  searchParams: URLSearchParams,
): TrackingParameters | null {
  const tracking: TrackingParameters = {};
  let totalLength = 0;

  for (const name of triggerParameterNames) {
    const values = searchParams.getAll(name);
    if (values.length === 0) continue;

    // Drop an ambiguous/invalid identifier; another valid identifier may still
    // establish the advertising entry.
    if (values.length !== 1 || !isValidValue(name, values[0])) continue;

    tracking[name] = values[0];
    totalLength += Buffer.byteLength(values[0], "utf8");
  }

  const hasTrigger = triggerParameterNames.some((name) => tracking[name]);
  if (!hasTrigger || totalLength > TOTAL_VALUE_MAX_LENGTH) return null;

  for (const name of forwardedParameterNames) {
    if (triggerParameterNames.includes(name as (typeof triggerParameterNames)[number])) {
      continue;
    }

    const values = searchParams.getAll(name);
    if (values.length !== 1 || !isValidValue(name, values[0])) continue;
    const valueBytes = Buffer.byteLength(values[0], "utf8");
    if (totalLength + valueBytes > TOTAL_VALUE_MAX_LENGTH) continue;

    tracking[name] = values[0];
    totalLength += valueBytes;
  }

  return tracking;
}
