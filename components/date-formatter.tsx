import { parseISO, format } from 'date-fns'

type Props = {
  dateString: string
}

const DateFormatter = ({ dateString }: Props) => {
  const date = parseISO(dateString)
  if (!date) {
    return null;
  }
  let formatted;
  try {
    formatted = format(date, 'LLLL	d, yyyy');
  } catch (err) {
    return null;
  }

  return <time dateTime={dateString}>{formatted}</time>
}

export default DateFormatter
