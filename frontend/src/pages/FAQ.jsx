import PageHeader from '../components/ui/PageHeader';
import Accordion from '../components/ui/Accordion';

export default function FAQ() {
  return (
    <div className="page">
      <div className="container">
        <PageHeader
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'FAQ' },
          ]}
          eyebrow="Help Center"
          title={
            <>
              Frequently Asked <em>Questions</em>
            </>
          }
          subtitle="Everything explained clearly—shopping, orders, delivery, and care. If you still need help after reading, use the Contact page."
        />

        <div className="card card-pad">
          <Accordion
            defaultOpenIndex={0}
            items={[
              {
                title: 'How do I place an order?',
                content:
                  'Go to Shop → open a product → choose quantity → Add to Bag → open Cart → Proceed to Checkout → fill shipping details → Place Order (Cash on Delivery).',
              },
              {
                title: 'Why do I need an account?',
                content:
                  'An account lets you manage your bag, place orders, and view order history. It also helps keep delivery information accurate.',
              },
              {
                title: 'What payment methods do you support?',
                content:
                  'Currently the site is configured for Cash on Delivery (COD). If you want, I can add online payment options later.',
              },
              {
                title: 'How can I track my order?',
                content:
                  'After ordering, go to My Orders to view the latest status (Processing → Shipped → Delivered).',
              },
              {
                title: 'What if a product is out of stock?',
                content:
                  'The product page will show “Out of Stock”. You can still browse and check other categories in Shop.',
              },
              {
                title: 'How do I care for woven materials?',
                content:
                  'Avoid soaking, clean gently with a soft brush, and store in a dry place. See the Care Guide page for step-by-step instructions.',
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

