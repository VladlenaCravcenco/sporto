import { FixedSizeList as List } from 'react-window';
import { OptimizedImage } from './OptimizedImage';

interface VirtualProductListProps {
  products: any[];
  width: number;
  height: number;
}

export function VirtualProductList({
  products,
  width,
  height,
}: VirtualProductListProps) {
  const itemHeight = 350; // высота одного товара

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const product = products[index];
    return (
      <div style={style} className="p-2">
        <div className="bg-white rounded-lg shadow">
          {/* Картинка */}
          <OptimizedImage
            src={product.image_url}
            alt={product.name_ro}
            width={300}
            height={300}
            className="rounded-t-lg"
          />

          {/* Информация */}
          <div className="p-3">
            <h3 className="text-sm font-bold truncate">{product.name_ro}</h3>
            <p className="text-lg font-bold text-red-600">{product.price} MDL</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <List
      height={height}
      itemCount={products.length}
      itemSize={itemHeight}
      width={width}
    >
      {Row}
    </List>
  );
}