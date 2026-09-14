import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { z } from 'zod';
import { all, one, run, transaction, audit } from './database';
import { AuthGuard, AuthRequest, role } from './auth';
import { parse, reason } from './validation';
@Controller('api/admin')
@UseGuards(AuthGuard)
export class AdminController {
  @Get('data') data(@Req() req: AuthRequest) {
    role(req.user, 'admin');
    return {
      orgs: all(
        'SELECT g.*, (SELECT COUNT(*) FROM outlets o WHERE o.orgId=g.id) AS outlets FROM orgs g ORDER BY g.created DESC',
      ).map((org) => ({
        ...org,
        setupOutlets: all('SELECT id,name,address,published FROM outlets WHERE orgId=?', org.id),
        setupServices: all('SELECT name,price,duration FROM services WHERE orgId=? AND active=1', org.id),
        setupBarbers: all('SELECT name,start,end FROM barbers WHERE orgId=? AND active=1', org.id),
        owners: all("SELECT name,email FROM users WHERE orgId=? AND role='owner'", org.id),
      })),
      audit: all(
        'SELECT a.*,u.name AS actorName FROM audit a LEFT JOIN users u ON u.id=a.actor ORDER BY a.created DESC LIMIT 200',
      ),
    };
  }
  @Post('orgs/:id/status') status(
    @Req() req: AuthRequest,
    @Param('id') orgId: string,
    @Body() body: unknown,
  ) {
    role(req.user, 'admin');
    const data = parse(z.object({ status: z.enum(['approved', 'rejected', 'suspended']), reason }), body);
    return transaction(() => {
      const org = one('SELECT * FROM orgs WHERE id=?', orgId);
      if (!org) throw new NotFoundException();
      const allowed: Record<string, string[]> = {
        pending: ['approved', 'rejected'],
        approved: ['suspended'],
        suspended: ['approved'],
      };
      if (!allowed[org.status]?.includes(data.status))
        throw new ConflictException('Perubahan status organisasi tidak diizinkan.');
      run('UPDATE orgs SET status=?,reason=? WHERE id=?', data.status, data.reason, orgId);
      if (data.status !== 'approved') run('UPDATE outlets SET published=0 WHERE orgId=?', orgId);
      audit({ ...req.user, orgId }, `org.${data.status}`, orgId, data.reason);
      return { ok: true };
    });
  }
}
