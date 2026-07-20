-- ============================================================
-- Rendertreue: fehlende Text-Attribute + Original/Anzeige-Trennung bei
-- Logos, damit das serverseitige Druckvorschau-Rendering (Phase 2,
-- src/lib/rendering/) exakt reproduzieren kann, was der Kunde im Editor
-- gesehen hat.
-- ============================================================

-- --- Logo: bisher wurde nur element.originalFileUrl (VOR
--     Hintergrundentfernung) gespeichert, obwohl der Kunde im Editor
--     element.fileUrl sieht (ggf. freigestellt, siehe LogoUploader.tsx).
--     Umbenennen zur Klarheit + neue Spalte für die tatsächlich
--     angezeigte/gerenderte Version. DB enthält aktuell nur Testdaten
--     (kein echter Kunde) -> Rename ist gefahrlos. ----------------------
alter table configuration_elements rename column file_url to original_file_url;
alter table configuration_elements add column display_file_url text;

-- --- Text: bisher fehlende Konva-Rendereigenschaften, ohne die der
--     Server-Renderer sichtbar anders aussehen würde als der Editor
--     (siehe TextElement in src/types/index.ts). -----------------------
alter table configuration_elements add column letter_spacing numeric(6,2);
alter table configuration_elements add column line_height numeric(4,2);
alter table configuration_elements add column has_shadow boolean not null default false;
alter table configuration_elements add column has_outline boolean not null default false;
alter table configuration_elements add column outline_color text;
