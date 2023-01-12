type Props = {
  name: string
  picture: string
}

const Avatar = ({ name, picture }: Props) => {
  if (!name) { 
    return null;
  }
  return (
    <div className="flex items-center">
      <img data-sb-field-path=".picture" src={picture} className="w-12 h-12 rounded-full mr-4" alt={name} />
      <div data-sb-field-path=".name" className="text-xl font-bold">{name}</div>
    </div>
  )
}

export default Avatar
