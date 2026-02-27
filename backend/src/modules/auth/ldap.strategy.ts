/**
 * LDAP / Microsoft Entra ID stub strategy.
 *
 * When LDAP_URL is set, this strategy uses ldapts to bind+search the
 * directory. When it is not set (development / staging without AD), the
 * strategy falls through gracefully so local-DB login remains available.
 *
 * Production TODO:
 *   1. Set env vars: LDAP_URL, LDAP_BIND_DN, LDAP_BIND_PASSWORD,
 *      LDAP_SEARCH_BASE, LDAP_SEARCH_FILTER
 *   2. Map AD attributes → UserRole (via group membership or custom attribute).
 *   3. Provision User row on first successful LDAP login (upsert by email).
 *
 * For Microsoft Entra ID (Azure AD):
 *   - Use OIDC flow via `passport-azure-ad` (not LDAP) for cloud-only tenants.
 *   - For hybrid on-prem+cloud, LDAP + Entra ID Seamless SSO work in tandem.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

@Injectable()
export class LdapStrategy extends PassportStrategy(Strategy, 'ldap') {
  private readonly logger = new Logger(LdapStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  /**
   * Validate credentials against LDAP/AD.
   * Returns the user object on success, throws on failure.
   *
   * STUB: delegates to local-DB validation until LDAP is configured.
   * When LDAP_URL is present, replace the body with an ldapts bind call.
   */
  async validate(email: string, password: string) {
    const ldapUrl = process.env['LDAP_URL'];

    if (ldapUrl) {
      this.logger.warn(
        'LDAP_URL is set but ldapts integration is a stub — falling through to DB auth.',
      );
      // REPLACE with real ldapts logic:
      // const client = new Client({ url: ldapUrl });
      // await client.bind(buildDN(email), password);
      // const { searchEntries } = await client.search(LDAP_SEARCH_BASE, { filter });
      // const user = await this.authService.upsertFromLdap(searchEntries[0]);
      // return user;
    }

    return this.authService.validateUser(email, password);
  }
}
