import Document, { Head, Html, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="it" className="bg-sand">
        <Head>
          <meta name="theme-color" content="#f6f0e8" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <body className="bg-sand text-ink">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
