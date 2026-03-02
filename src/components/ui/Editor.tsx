import { Editor as TinyMCEEditor } from "@tinymce/tinymce-react";

const DEFAULT_PLUGINS = [
  // Core editing features
  "anchor",
  "autolink",
  "charmap",
  "codesample",
  "emoticons",
  "link",
  "lists",
  "media",
  "searchreplace",
  "table",
  "visualblocks",
  "wordcount",
  // Your account includes a free trial of TinyMCE premium features
  // Try the most popular premium features until Mar 14, 2026:
  "checklist",
  "mediaembed",
  "casechange",
  "formatpainter",
  "pageembed",
  "a11ychecker",
  "permanentpen",
  "powerpaste",
  "advtable",
  "advcode",
  "advtemplate",
  "mentions",
  "tableofcontents",
  "footnotes",
  "mergetags",
  "autocorrect",
  "typography",
  "inlinecss",
  "markdown",
  "importword",
  "exportword",
  "exportpdf",
];
const DEFAULT_TOOLBAR =
  "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat";

export interface RichEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
}

export function Editor({ value, onChange, height = 300 }: RichEditorProps) {
  return (
    <TinyMCEEditor
      apiKey={import.meta.env.VITE_TINYMCE_API_KEY || "no-api-key"}
      value={value}
      init={{
        height,
        menubar: false,
        plugins: DEFAULT_PLUGINS,
        toolbar: DEFAULT_TOOLBAR,
      }}
      onEditorChange={onChange}
    />
  );
}
