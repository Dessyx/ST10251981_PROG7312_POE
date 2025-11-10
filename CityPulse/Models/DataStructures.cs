using System;
using System.Collections.Generic;
using System.Linq;

namespace CityPulse.Models
{

	public class BSTNode<T>
	{
		public string Key { get; set; }
		public T Value { get; set; }
		public BSTNode<T> Left { get; set; }
		public BSTNode<T> Right { get; set; }

		public BSTNode(string key, T value)
		{
			Key = key;
			Value = value;
		}
	}

	public class BinarySearchTree<T>
	{
		public BSTNode<T> Root { get; private set; }
		public int Count { get; private set; }

		public void Insert(string key, T value)
		{
			Root = InsertRecursive(Root, key, value);
			Count++;
		}

		private BSTNode<T> InsertRecursive(BSTNode<T> node, string key, T value)
		{
			if (node == null)
				return new BSTNode<T>(key, value);

			int comparison = string.Compare(key, node.Key, StringComparison.Ordinal);
			if (comparison < 0)
				node.Left = InsertRecursive(node.Left, key, value);
			else if (comparison > 0)
				node.Right = InsertRecursive(node.Right, key, value);
			else
				node.Value = value; 

			return node;
		}

		public T Search(string key)
		{
			return SearchRecursive(Root, key);
		}

		private T SearchRecursive(BSTNode<T> node, string key)
		{
			if (node == null)
				return default(T);

			int comparison = string.Compare(key, node.Key, StringComparison.Ordinal);
			if (comparison == 0)
				return node.Value;
			else if (comparison < 0)
				return SearchRecursive(node.Left, key);
			else
				return SearchRecursive(node.Right, key);
		}

		public List<T> InOrderTraversal()
		{
			var result = new List<T>();
			InOrderRecursive(Root, result);
			return result;
		}

		private void InOrderRecursive(BSTNode<T> node, List<T> result)
		{
			if (node != null)
			{
				InOrderRecursive(node.Left, result);
				result.Add(node.Value);
				InOrderRecursive(node.Right, result);
			}
		}
	}

    // ----------------------------------------------------------------------------
    // AVL Tree
    public class AVLNode<T>
	{
		public DateTime Key { get; set; }
		public T Value { get; set; }
		public AVLNode<T> Left { get; set; }
		public AVLNode<T> Right { get; set; }
		public int Height { get; set; }

		public AVLNode(DateTime key, T value)
		{
			Key = key;
			Value = value;
			Height = 1;
		}
	}

	public class AVLTree<T>
	{
		public AVLNode<T> Root { get; private set; }
		public int Count { get; private set; }

		private int GetHeight(AVLNode<T> node)
		{
			return node?.Height ?? 0;
		}

		private int GetBalance(AVLNode<T> node)
		{
			return node == null ? 0 : GetHeight(node.Left) - GetHeight(node.Right);
		}

		private AVLNode<T> RotateRight(AVLNode<T> y)
		{
			AVLNode<T> x = y.Left;
			AVLNode<T> T2 = x.Right;

			x.Right = y;
			y.Left = T2;

			y.Height = Math.Max(GetHeight(y.Left), GetHeight(y.Right)) + 1;
			x.Height = Math.Max(GetHeight(x.Left), GetHeight(x.Right)) + 1;

			return x;
		}

		private AVLNode<T> RotateLeft(AVLNode<T> x)
		{
			AVLNode<T> y = x.Right;
			AVLNode<T> T2 = y.Left;

			y.Left = x;
			x.Right = T2;

			x.Height = Math.Max(GetHeight(x.Left), GetHeight(x.Right)) + 1;
			y.Height = Math.Max(GetHeight(y.Left), GetHeight(y.Right)) + 1;

			return y;
		}

		public void Insert(DateTime key, T value)
		{
			Root = InsertRecursive(Root, key, value);
			Count++;
		}

		private AVLNode<T> InsertRecursive(AVLNode<T> node, DateTime key, T value)
		{
			if (node == null)
				return new AVLNode<T>(key, value);

			if (key < node.Key)
				node.Left = InsertRecursive(node.Left, key, value);
			else if (key > node.Key)
				node.Right = InsertRecursive(node.Right, key, value);
			else
			{
				node.Value = value;
				return node;
			}

			node.Height = 1 + Math.Max(GetHeight(node.Left), GetHeight(node.Right));

			int balance = GetBalance(node);

			// Left Left Case
			if (balance > 1 && key < node.Left.Key)
				return RotateRight(node);

			// Right Right Case
			if (balance < -1 && key > node.Right.Key)
				return RotateLeft(node);

			// Left Right Case
			if (balance > 1 && key > node.Left.Key)
			{
				node.Left = RotateLeft(node.Left);
				return RotateRight(node);
			}

			// Right Left Case
			if (balance < -1 && key < node.Right.Key)
			{
				node.Right = RotateRight(node.Right);
				return RotateLeft(node);
			}

			return node;
		}

		public List<T> GetInRange(DateTime startDate, DateTime endDate)
		{
			var result = new List<T>();
			GetInRangeRecursive(Root, startDate, endDate, result);
			return result;
		}

		private void GetInRangeRecursive(AVLNode<T> node, DateTime start, DateTime end, List<T> result)
		{
			if (node == null)
				return;

			if (node.Key > start)
				GetInRangeRecursive(node.Left, start, end, result);

			if (node.Key >= start && node.Key <= end)
				result.Add(node.Value);

			if (node.Key < end)
				GetInRangeRecursive(node.Right, start, end, result);
		}

		public List<T> InOrderTraversal()
		{
			var result = new List<T>();
			InOrderRecursive(Root, result);
			return result;
		}

		private void InOrderRecursive(AVLNode<T> node, List<T> result)
		{
			if (node != null)
			{
				InOrderRecursive(node.Left, result);
				result.Add(node.Value);
				InOrderRecursive(node.Right, result);
			}
		}
	}

    // ----------------------------------------------------------------------------
	// NinHeap
    public class MinHeap<T> where T : class
	{
		private List<(int priority, T item)> _heap;
		public int Count => _heap.Count;

		public MinHeap()
		{
			_heap = new List<(int, T)>();
		}

		public void Insert(int priority, T item)
		{
			_heap.Add((priority, item));
			HeapifyUp(_heap.Count - 1);
		}

		public T ExtractMin()
		{
			if (_heap.Count == 0)
				return null;

			var min = _heap[0].item;
			_heap[0] = _heap[_heap.Count - 1];
			_heap.RemoveAt(_heap.Count - 1);

			if (_heap.Count > 0)
				HeapifyDown(0);

			return min;
		}

		public T PeekMin()
		{
			return _heap.Count > 0 ? _heap[0].item : null;
		}

		public List<T> GetAllItems()
		{
			return _heap.OrderBy(x => x.priority).Select(x => x.item).ToList();
		}

		private void HeapifyUp(int index)
		{
			while (index > 0)
			{
				int parentIndex = (index - 1) / 2;
				if (_heap[index].priority >= _heap[parentIndex].priority)
					break;

				Swap(index, parentIndex);
				index = parentIndex;
			}
		}

		private void HeapifyDown(int index)
		{
			while (true)
			{
				int leftChild = 2 * index + 1;
				int rightChild = 2 * index + 2;
				int smallest = index;

				if (leftChild < _heap.Count && _heap[leftChild].priority < _heap[smallest].priority)
					smallest = leftChild;

				if (rightChild < _heap.Count && _heap[rightChild].priority < _heap[smallest].priority)
					smallest = rightChild;

				if (smallest == index)
					break;

				Swap(index, smallest);
				index = smallest;
			}
		}

		private void Swap(int i, int j)
		{
			var temp = _heap[i];
			_heap[i] = _heap[j];
			_heap[j] = temp;
		}
	}

	// -----------------------------------------------------------------------------
	// GRAPH 
	public class GraphNode
	{
		public string Id { get; set; }
		public IssueReport Report { get; set; }
		public List<GraphEdge> Edges { get; set; }

		public GraphNode(string id, IssueReport report)
		{
			Id = id;
			Report = report;
			Edges = new List<GraphEdge>();
		}
	}

	public class GraphEdge
	{
		public GraphNode Target { get; set; }
		public double Weight { get; set; }
		public string RelationType { get; set; } // "location", "category", "temporal"

		public GraphEdge(GraphNode target, double weight, string relationType)
		{
			Target = target;
			Weight = weight;
			RelationType = relationType;
		}
	}

	public class ServiceRequestGraph
	{
		private Dictionary<string, GraphNode> _nodes;
		public int NodeCount => _nodes.Count;

		public ServiceRequestGraph()
		{
			_nodes = new Dictionary<string, GraphNode>();
		}

		public void AddNode(IssueReport report)
		{
			if (!_nodes.ContainsKey(report.ReferenceNumber))
			{
				_nodes[report.ReferenceNumber] = new GraphNode(report.ReferenceNumber, report);
			}
		}

		public void AddEdge(string fromRef, string toRef, double weight, string relationType)
		{
			if (_nodes.ContainsKey(fromRef) && _nodes.ContainsKey(toRef))
			{
				var edge = new GraphEdge(_nodes[toRef], weight, relationType);
				_nodes[fromRef].Edges.Add(edge);
			}
		}

		public GraphNode GetNode(string refNumber)
		{
			return _nodes.ContainsKey(refNumber) ? _nodes[refNumber] : null;
		}

		public List<IssueReport> BreadthFirstSearch(string startRef)
		{
			var result = new List<IssueReport>();
			if (!_nodes.ContainsKey(startRef))
				return result;

			var visited = new HashSet<string>();
			var queue = new System.Collections.Generic.Queue<GraphNode>();
			
			queue.Enqueue(_nodes[startRef]);
			visited.Add(startRef);

			while (queue.Count > 0)
			{
				var current = queue.Dequeue();
				result.Add(current.Report);

				foreach (var edge in current.Edges)
				{
					if (!visited.Contains(edge.Target.Id))
					{
						visited.Add(edge.Target.Id);
						queue.Enqueue(edge.Target);
					}
				}
			}

			return result;
		}

		public List<IssueReport> DepthFirstSearch(string startRef)
		{
			var result = new List<IssueReport>();
			if (!_nodes.ContainsKey(startRef))
				return result;

			var visited = new HashSet<string>();
			DFSRecursive(_nodes[startRef], visited, result);
			return result;
		}

		private void DFSRecursive(GraphNode node, HashSet<string> visited, List<IssueReport> result)
		{
			visited.Add(node.Id);
			result.Add(node.Report);

			foreach (var edge in node.Edges)
			{
				if (!visited.Contains(edge.Target.Id))
				{
					DFSRecursive(edge.Target, visited, result);
				}
			}
		}

		public List<IssueReport> GetRelatedReports(string refNumber, string relationType = null)
		{
			var result = new List<IssueReport>();
			if (!_nodes.ContainsKey(refNumber))
				return result;

			var node = _nodes[refNumber];
			foreach (var edge in node.Edges)
			{
				if (relationType == null || edge.RelationType == relationType)
				{
					result.Add(edge.Target.Report);
				}
			}

			return result;
		}

	
		public List<GraphEdge> GetMinimumSpanningTree()
		{
			var allEdges = new List<(string from, GraphEdge edge)>();
			
			foreach (var kvp in _nodes)
			{
				foreach (var edge in kvp.Value.Edges)
				{
					allEdges.Add((kvp.Key, edge));
				}
			}


			allEdges = allEdges.OrderBy(e => e.edge.Weight).ToList();

			var mst = new List<GraphEdge>();
			var parent = new Dictionary<string, string>();
			

			foreach (var key in _nodes.Keys)
			{
				parent[key] = key;
			}

			foreach (var (from, edge) in allEdges)
			{
				string root1 = Find(parent, from);
				string root2 = Find(parent, edge.Target.Id);

				if (root1 != root2)
				{
					mst.Add(edge);
					Union(parent, root1, root2);
				}

				if (mst.Count == _nodes.Count - 1)
					break;
			}

			return mst;
		}

		private string Find(Dictionary<string, string> parent, string node)
		{
			if (parent[node] != node)
				parent[node] = Find(parent, parent[node]);
			return parent[node];
		}

		private void Union(Dictionary<string, string> parent, string x, string y)
		{
			parent[Find(parent, x)] = Find(parent, y);
		}

		public Dictionary<string, int> GetDegreeDistribution()
		{
			var distribution = new Dictionary<string, int>();
			foreach (var node in _nodes.Values)
			{
				distribution[node.Id] = node.Edges.Count;
			}
			return distribution;
		}

		public List<GraphNode> GetAllNodes()
		{
			return _nodes.Values.ToList();
		}

		public void BuildRelationships()
		{
			var nodeList = _nodes.Values.ToList();
			
			for (int i = 0; i < nodeList.Count; i++)
			{
				for (int j = i + 1; j < nodeList.Count; j++)
				{
					var report1 = nodeList[i].Report;
					var report2 = nodeList[j].Report;

				
					if (report1.Location == report2.Location)
					{
						AddEdge(report1.ReferenceNumber, report2.ReferenceNumber, 1.0, "location");
						AddEdge(report2.ReferenceNumber, report1.ReferenceNumber, 1.0, "location");
					}

				
					if (report1.Category == report2.Category)
					{
						AddEdge(report1.ReferenceNumber, report2.ReferenceNumber, 2.0, "category");
						AddEdge(report2.ReferenceNumber, report1.ReferenceNumber, 2.0, "category");
					}

				
					var timeDiff = Math.Abs((report1.CreatedUtc - report2.CreatedUtc).TotalDays);
					if (timeDiff <= 7)
					{
						AddEdge(report1.ReferenceNumber, report2.ReferenceNumber, timeDiff, "temporal");
						AddEdge(report2.ReferenceNumber, report1.ReferenceNumber, timeDiff, "temporal");
					}
				}
			}
		}
	}

	// ----------------------------------------------------------------------------
	// Red-Black Tree Node Colors

	public enum RBColor { Red, Black }

    // ----------------------------------------------------------------------------
    // Red-Black Tree 
    public class RBNode<T>
	{
		public string Key { get; set; }
		public T Value { get; set; }
		public RBColor Color { get; set; }
		public RBNode<T> Left { get; set; }
		public RBNode<T> Right { get; set; }
		public RBNode<T> Parent { get; set; }

		public RBNode(string key, T value)
		{
			Key = key;
			Value = value;
			Color = RBColor.Red;
		}
	}

	public class RedBlackTree<T>
	{
		private RBNode<T> _root;
		private readonly RBNode<T> _nil;
		public int Count { get; private set; }

		public RedBlackTree()
		{
			_nil = new RBNode<T>(null, default(T)) { Color = RBColor.Black };
			_root = _nil;
		}

		public void Insert(string key, T value)
		{
			var node = new RBNode<T>(key, value)
			{
				Left = _nil,
				Right = _nil,
				Parent = _nil
			};

			RBNode<T> parent = _nil;
			RBNode<T> current = _root;

			while (current != _nil)
			{
				parent = current;
				if (string.Compare(key, current.Key, StringComparison.Ordinal) < 0)
					current = current.Left;
				else
					current = current.Right;
			}

			node.Parent = parent;

			if (parent == _nil)
				_root = node;
			else if (string.Compare(key, parent.Key, StringComparison.Ordinal) < 0)
				parent.Left = node;
			else
				parent.Right = node;

			node.Color = RBColor.Red;
			FixInsert(node);
			Count++;
		}

		private void FixInsert(RBNode<T> node)
		{
			while (node.Parent.Color == RBColor.Red)
			{
				if (node.Parent == node.Parent.Parent.Left)
				{
					var uncle = node.Parent.Parent.Right;
					if (uncle.Color == RBColor.Red)
					{
						node.Parent.Color = RBColor.Black;
						uncle.Color = RBColor.Black;
						node.Parent.Parent.Color = RBColor.Red;
						node = node.Parent.Parent;
					}
					else
					{
						if (node == node.Parent.Right)
						{
							node = node.Parent;
							RotateLeft(node);
						}
						node.Parent.Color = RBColor.Black;
						node.Parent.Parent.Color = RBColor.Red;
						RotateRight(node.Parent.Parent);
					}
				}
				else
				{
					var uncle = node.Parent.Parent.Left;
					if (uncle.Color == RBColor.Red)
					{
						node.Parent.Color = RBColor.Black;
						uncle.Color = RBColor.Black;
						node.Parent.Parent.Color = RBColor.Red;
						node = node.Parent.Parent;
					}
					else
					{
						if (node == node.Parent.Left)
						{
							node = node.Parent;
							RotateRight(node);
						}
						node.Parent.Color = RBColor.Black;
						node.Parent.Parent.Color = RBColor.Red;
						RotateLeft(node.Parent.Parent);
					}
				}

				if (node == _root)
					break;
			}
			_root.Color = RBColor.Black;
		}

		private void RotateLeft(RBNode<T> x)
		{
			var y = x.Right;
			x.Right = y.Left;
			
			if (y.Left != _nil)
				y.Left.Parent = x;
			
			y.Parent = x.Parent;
			
			if (x.Parent == _nil)
				_root = y;
			else if (x == x.Parent.Left)
				x.Parent.Left = y;
			else
				x.Parent.Right = y;
			
			y.Left = x;
			x.Parent = y;
		}

		private void RotateRight(RBNode<T> x)
		{
			var y = x.Left;
			x.Left = y.Right;
			
			if (y.Right != _nil)
				y.Right.Parent = x;
			
			y.Parent = x.Parent;
			
			if (x.Parent == _nil)
				_root = y;
			else if (x == x.Parent.Right)
				x.Parent.Right = y;
			else
				x.Parent.Left = y;
			
			y.Right = x;
			x.Parent = y;
		}

		public T Search(string key)
		{
			var node = SearchNode(_root, key);
			return node != _nil ? node.Value : default(T);
		}

		private RBNode<T> SearchNode(RBNode<T> node, string key)
		{
			if (node == _nil || key == node.Key)
				return node;

			if (string.Compare(key, node.Key, StringComparison.Ordinal) < 0)
				return SearchNode(node.Left, key);
			else
				return SearchNode(node.Right, key);
		}

		public List<T> InOrderTraversal()
		{
			var result = new List<T>();
			InOrderRecursive(_root, result);
			return result;
		}

		private void InOrderRecursive(RBNode<T> node, List<T> result)
		{
			if (node != _nil)
			{
				InOrderRecursive(node.Left, result);
				result.Add(node.Value);
				InOrderRecursive(node.Right, result);
			}
		}
	}
}

