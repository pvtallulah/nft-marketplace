import { MigrationInterface, QueryRunner } from "typeorm";

export class transactionLogAnalitycs1671822450958 implements MigrationInterface {
    name = 'transactionLogAnalitycs1671822450958'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transaction_log\` ADD \`calendarDateCalendarDate\` date NULL`);
        await queryRunner.query(`ALTER TABLE \`transaction_log\` ADD CONSTRAINT \`FK_c94aa90b778dc25954000c0d041\` FOREIGN KEY (\`calendarDateCalendarDate\`) REFERENCES \`calendar\`(\`calendarDate\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transaction_log\` DROP FOREIGN KEY \`FK_c94aa90b778dc25954000c0d041\``);
        await queryRunner.query(`ALTER TABLE \`transaction_log\` DROP COLUMN \`calendarDateCalendarDate\``);
    }

}
