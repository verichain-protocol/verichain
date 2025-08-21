export function getInternetIdentityNetwork(): string | null {
  const canisterId = import.meta.env.CANISTER_ID_INTERNET_IDENTITY;
  const network = import.meta.env.DFX_NETWORK;

  if (!canisterId) {
    console.warn("CANISTER_ID_INTERNET_IDENTITY is not set.");
    return null;
  }

  if (network === "local") {
    return `http://${canisterId}.localhost:4943`;
  } else {
    return `https://identity.ic0.app`;
  }
}

export function jsonStringify(data: any): string {
  return JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v));
}

export function formatTimestamp(initialTimestamp: bigint | number, label: string = "Last updated: "): string {
  let timestamp = typeof initialTimestamp === "bigint" ? Number(initialTimestamp) : initialTimestamp;
  const now = Date.now();
  const inputTime = timestamp / 1_000; 
  const diff = Math.floor((now - inputTime) / 1000); 

  let timeString = diff < 60 ? `${diff} Seconds ago` : diff < 3600 ? `${Math.floor(diff / 60)} Minutes ago` : diff < 86400 ? `Yesterday` : diff < 604800 ? `${Math.floor(diff / 86400)} Days ago` : `${Math.floor(diff / 604800)} Weeks ago`;

  return label + timeString;
}

export function mapOptionalToFormattedJSON(data: any): any {
  if (!data || typeof data !== "object") return data;

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) return [key, null]; 
        if (value.length === 1) return [key, value[0]]; 
        return [key, value.flat()]; 
      }

      return [key, value];
    })
  );
}

export function unixToDateString(unix: number | bigint): string {
  return new Date(Number(unix) * 1000).toISOString().split("T")[0];
}

export function toUnixTimestamps(dateString: string | null): number | null {
  return dateString === null ? null : Math.floor(new Date(dateString).getTime() / 1000);
}

export function optValue(value: any): any {
  if (typeof value === "string") {
    return value ? [value] : [];
  } else if (typeof value === "number") {
    return value ? [value] : [];
  } else if (Array.isArray(value)) {
    return [value.map((item: any) => optValue(item)[0])];
  } else if (typeof value === "object") {
    return [
      Object.entries(value).reduce((acc: Record<string, any>, [key, value]) => {
        acc[key] = [value];
        return acc;
      }, {}),
    ];
  }

  return value;
}

export function extractOptValue(optValue: any, useZeroIndex: boolean = true, isArray: boolean = false): any {
  let value = optValue;

  if (useZeroIndex) value = optValue[0];

  if (typeof value === "string") {
    if (isArray) return value;
    return value[0];
  } else if (typeof value === "number") {
    if (isArray) return value;
    // Numbers don't have indexed access, return as is
    return value;
  } else if (Array.isArray(value)) {
    return value.map((item: any) => extractOptValue(item, false, true));
  } else if (typeof value === "object" && value !== null) {
    return Object.entries(value).reduce((acc: Record<string, any>, [key, value]) => {
      acc[key] = Array.isArray(value) ? value[0] : value; // Ambil nilai pertama dari array
      return acc;
    }, {});
  }

  return value;
}

export function prepareArg(value: any): any {
  if (value === null || value === "" || (Array.isArray(value) && value.length === 0) || Number.isNaN(value) || (typeof value === "object" && Object.keys(value).length === 0)) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item: any) => (typeof item === "object" ? prepareArg(item) : item));
  }

  if (typeof value === "object") {
    const transformedObject: Record<string, any> = Object.fromEntries(Object.entries(value).map(([key, val]) => [key, prepareArg(val)]));
    return [transformedObject]; 
  }

  return [value]; 
}
