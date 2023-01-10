import Container from "./container";

export type Language = {
  id: string;
  title: string;
};

type Props = {
  languages?: Language[];
  translations?: Record<string, string>;
  currentLocale?: string;
};

const Footer = (props: Props) => {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200">
      <Container>
        <div className="p-8 pb-28 items-center">
          <div className="text-sm text-gray-500">Language</div>
          <div className="py-2">
            {props.languages && (
              <div className="inline-block relative w-64">
                <select
                  value={props.currentLocale}
                  onChange={(e) => {
                    const locale = e.target.value;
                    window.location.href = props.translations[locale];
                    (window as any).stackbit?.setLocale(locale);
                  }}
                  className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                >
                  {props.languages.map((lang) => {
                    return (
                      <option
                        value={lang.id}
                        disabled={!Boolean(props.translations[lang.id])}
                        key={lang.id}
                      >
                        {lang.title}
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
