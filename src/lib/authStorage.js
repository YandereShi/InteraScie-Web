const preferenceKey = "InteraScieRememberMe";
const memoryStorage = new Map();
let rememberMe;

function ReadItem(storage, key) {
  try {
    return window[storage].getItem(key);
  } catch {
    return null;
  }
}

function WriteItem(storage, key, value) {
  try {
    window[storage].setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function RemoveItem(storage, key) {
  try {
    window[storage].removeItem(key);
  } catch {
    return;
  }
}

export function GetRememberMe() {
  return rememberMe ?? ReadItem("localStorage", preferenceKey) === "true";
}

export function SaveRememberMe(value) {
  rememberMe = value === true;
  WriteItem("localStorage", preferenceKey, String(rememberMe));
}

export const authStorage = {
  getItem(key) {
    const storage = GetRememberMe() ? "localStorage" : "sessionStorage";
    return memoryStorage.get(key) ?? ReadItem(storage, key) ?? null;
  },
  setItem(key, value) {
    const storage = GetRememberMe() ? "localStorage" : "sessionStorage";

    if (WriteItem(storage, key, value)) {
      memoryStorage.delete(key);
    } else {
      memoryStorage.set(key, value);
      RemoveItem(storage, key);
    }

    RemoveItem(GetRememberMe() ? "sessionStorage" : "localStorage", key);
  },
  removeItem(key) {
    memoryStorage.delete(key);
    RemoveItem("localStorage", key);
    RemoveItem("sessionStorage", key);
  },
};
