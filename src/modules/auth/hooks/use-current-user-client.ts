import Cookies from "js-cookie";

export const currentUser = () => {
  const user = Cookies.get("user");
  if (!user) return null;

  const parsedUser = JSON.parse(user);
  return parsedUser;
};
