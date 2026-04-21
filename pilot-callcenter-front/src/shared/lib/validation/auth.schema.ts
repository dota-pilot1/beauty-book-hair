import { z } from "zod";

const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,100}$/;

export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, "이메일을 입력해주세요.")
      .max(255, "이메일은 255자 이하여야 합니다.")
      .email("올바른 이메일 형식이 아닙니다."),

    password: z
      .string()
      .min(1, "비밀번호를 입력해주세요.")
      .regex(PASSWORD_REGEX, "비밀번호는 영문/숫자/특수문자를 포함한 8자 이상이어야 합니다."),

    passwordConfirm: z.string().min(1, "비밀번호 확인을 입력해주세요."),

    username: z
      .string()
      .min(2, "사용자명은 2자 이상이어야 합니다.")
      .max(50, "사용자명은 50자 이하여야 합니다."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "비밀번호가 일치하지 않습니다.",
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해주세요.")
    .email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
