import { MigrationInterface, QueryRunner } from "typeorm";
import dotenv from "dotenv";
dotenv.config();

const { MARKETPLACE_ADDRESS } = process.env;
export class initialMigration1671650744593 implements MigrationInterface {
  name = "initialMigration1671650744593";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE if not exists transaction_type (
        id int NOT NULL AUTO_INCREMENT,
        type varchar(255) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY IDX_2105feb8037c010bad24407f7b (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
    );
    await queryRunner.query(
      `insert into transaction_type (type) values ('buy')`
    );
    await queryRunner.query(
      `insert into transaction_type (type) values ('sell')`
    );
    await queryRunner.query(
      `insert into transaction_type (type) values ('cancel')`
    );
    await queryRunner.query(
      `insert into transaction_type (type) values ('paperPurchase')`
    );
    await queryRunner.query(
      `insert into transaction_type (type) values ('paperPurchase2')`
    );
    await queryRunner.query(
      `insert into transaction_type (type) values ('paperCallback2')`
    );
    await queryRunner.query(
      `insert into transaction_type (type) values ('paperCallback')`
    );
    await queryRunner.query(
      `insert into transaction_type (type) values ('setPrice')`
    );
    await queryRunner.query(
      `insert into transaction_type (type) values ('buyForGift')`
    );
    await queryRunner.query(
      `CREATE TABLE if not exists transaction_status (
        id int NOT NULL AUTO_INCREMENT,
        status varchar(255) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY IDX_c95f9a3ecdf20f2675d2d75646 (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
    );
    await queryRunner.query(
      `insert into transaction_status (status) values ('pending')`
    );
    await queryRunner.query(
      `insert into transaction_status (status) values ('success')`
    );
    await queryRunner.query(
      `insert into transaction_status (status) values ('failed')`
    );

    await queryRunner.query(
      ` CREATE TABLE  if not exists calendar (
        calendar_date date NOT NULL,
        PRIMARY KEY (calendar_date)
      ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
    );

    const datesArr = [];
    let startDate = new Date(2022, 0, 1);
    const endDate = new Date(2030, 11, 31);
    while (startDate <= endDate) {
      var newDate = startDate.setDate(startDate.getDate() + 1);
      startDate = new Date(newDate);
      datesArr.push(startDate.toISOString().split("T")[0]);
    }
    for (const dateKey of datesArr) {
      await queryRunner.query(
        `insert into calendar (calendar_date) values ('${dateKey}')`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`delete from transaction_type`);
    await queryRunner.query(`delete from transaction_status`);
  }
}
