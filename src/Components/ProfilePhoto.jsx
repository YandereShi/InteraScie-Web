import { useQuery } from "@tanstack/react-query";
import { GetProfilePhotoQueryKey, GetProfilePhotoUrl } from "../lib/profilePhotos";

function ProfilePhoto({ path, fallback, ...imageProps }) {
  const photoQuery = useQuery({
    queryKey: GetProfilePhotoQueryKey(path),
    queryFn: () => GetProfilePhotoUrl(path),
    enabled: Boolean(path),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  return (
    <img
      key={path ?? "fallback"}
      {...imageProps}
      src={photoQuery.data || fallback}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = fallback;
      }}
    />
  );
}

export default ProfilePhoto;
