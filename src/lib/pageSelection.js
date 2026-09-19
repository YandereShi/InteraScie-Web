function GetSelectionKey(authUserID, page, field) {
  return `ScieVerseSelection:${authUserID}:${page}:${field}`;
}

export function GetPageSelection(authUserID, page, field) {
  if (!authUserID) {
    return "";
  }

  try {
    return window.sessionStorage.getItem(GetSelectionKey(authUserID, page, field)) ?? "";
  } catch {
    return "";
  }
}

export function SavePageSelection(authUserID, page, field, value) {
  if (!authUserID) {
    return false;
  }

  try {
    const key = GetSelectionKey(authUserID, page, field);

    if (value) {
      window.sessionStorage.setItem(key, String(value));
    } else {
      window.sessionStorage.removeItem(key);
    }

    return true;
  } catch {
    return false;
  }
}
