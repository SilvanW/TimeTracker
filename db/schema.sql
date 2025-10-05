CREATE TABLE tblprojects (
    id int8 GENERATED ALWAYS AS IDENTITY(
        INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE
    ) NOT NULL,
    "name" varchar NULL,
    CONSTRAINT tblprojects_pk PRIMARY KEY (id)
);

CREATE TABLE tbltime (
    id int8 GENERATED ALWAYS AS IDENTITY(
        INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE
    ) NOT NULL,
    project_id int8 NOT NULL,
    "start" timestamp NULL,
    "end" timestamp NULL,
    CONSTRAINT tbltime_pk PRIMARY KEY (id),
    CONSTRAINT tbltime_tblprojects_fk FOREIGN KEY (project_id) REFERENCES tblprojects(id)
);