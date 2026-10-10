// Re-export official VK ID SDK types and enums for use across the app.
// The SDK is installed via npm (@vkid/sdk@2.6.8) — no CDN/UMD script.
export {
  Config,
  ConfigResponseMode,
  ConfigSource,
  Auth,
  AuthErrorCode,
  OneTap,
  OneTapSkin,
  OneTapContentId,
  OneTapInternalEvents,
  FloatingOneTap,
  FloatingOneTapInternalEvents,
  OAuthList,
  OAuthName,
  OAuthListInternalEvents,
  WidgetEvents,
  Languages,
  Scheme,
} from '@vkid/sdk';

export type {
  ConfigData,
  AuthParams,
  AuthError,
  AuthResponse,
  TokenResult,
  UserInfoResult,
  PublicInfoResult,
  OneTapParams,
  OneTapStyles,
  OAuthListParams,
  OAuthListStyles,
  LogoutResult,
} from '@vkid/sdk';
