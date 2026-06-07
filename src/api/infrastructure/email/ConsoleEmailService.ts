/**
 * ConsoleEmailService — Implementation dev de IEmailService.
 *
 * Loggue les emails dans la console via pino.
 * En production, remplacer par un adaptateur Resend/Postmark/SES.
 */

import type { IEmailService } from '../../domain/entities';
import { logger } from '../../config/logger';

export class ConsoleEmailService implements IEmailService {
  async sendWelcomeEmail(to: string): Promise<void> {
    logger.info(
      { to, template: 'welcome' },
      'Email de bienvenue envoye (mode console)',
    );
  }
}
